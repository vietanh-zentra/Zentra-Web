"""
Data Normalizer Module — Phase H3 & H4

Converts raw MT5 deal/position data into CONTRACT.md-compliant JSON.
Handles: timestamp conversion, BUY/SELL mapping, net_profit calculation,
duration_seconds, nullable SL/TP, and the critical deal IN/OUT pairing.

Author: Hoà (MT5 Engine Lead)
"""
import logging
from datetime import datetime
import MetaTrader5 as mt5
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

# Constants — MT5 deal type filters
DEAL_TYPES_TRADE = [mt5.DEAL_TYPE_BUY, mt5.DEAL_TYPE_SELL]
DEAL_ENTRY_IN = mt5.DEAL_ENTRY_IN
DEAL_ENTRY_OUT = mt5.DEAL_ENTRY_OUT


class DataNormalizer:
    """
    Normalizes raw MT5 data to CONTRACT.md JSON format.
    All static methods — no state needed.

    Key responsibilities:
    - Convert Unix timestamps → ISO 8601 UTC strings
    - Map MT5 type enums → "BUY" / "SELL" strings
    - Calculate net_profit = profit + commission + swap
    - Calculate duration_seconds = close_time - open_time
    - Handle nullable SL/TP (0 from MT5 → null in JSON)
    - Pair deal_IN + deal_OUT by position_id (the hardest part)
    """

    @staticmethod
    def get_tp_sl_from_order(order_ticket: int) -> Tuple[Optional[float], Optional[float]]:
        """
        Lookup TP and SL from order history.

        Args:
            order_ticket: The order ticket to look up

        Returns:
            Tuple of (take_profit, stop_loss), either can be None
        """
        if not order_ticket:
            return (None, None)
        try:
            orders = mt5.history_orders_get(ticket=order_ticket)
            if orders and len(orders) > 0:
                order = orders[0]
                tp = getattr(order, 'price_tp', None) or getattr(order, 'tp', None)
                sl = getattr(order, 'price_sl', None) or getattr(order, 'sl', None)
                # Convert 0.0 to None per CONTRACT.md nullable policy
                tp = tp if tp and tp > 0 else None
                sl = sl if sl and sl > 0 else None
                logger.debug(f"[NORMALIZE] Order {order_ticket}: TP={tp}, SL={sl}")
                return (tp, sl)
        except Exception as e:
            logger.debug(f"[NORMALIZE] Could not retrieve TP/SL for order {order_ticket}: {e}")
        return (None, None)

    @staticmethod
    def calculate_duration_seconds(open_time: int, close_time: int) -> int:
        """Calculate trade duration in seconds."""
        if not open_time or not close_time:
            return 0
        return max(0, close_time - open_time)

    @staticmethod
    def pair_open_close_deals(deals: List[Any]) -> Dict[int, Dict[str, Any]]:
        """
        The core algorithm: pair deal_IN and deal_OUT by position_id.

        This is documented as the hardest part of the MT5 engine.
        See CONTRACT.md Section 3 (Trade Lifecycle Mapping) for the full flow.

        Steps:
        1. Filter to only BUY/SELL deals (discard BALANCE, CREDIT, etc.)
        2. Separate into ENTRY_IN (open) and ENTRY_OUT (close) lists
        3. Group by position_id
        4. For each position: accumulate profit, commission, swap from close deals
        5. Only return positions that have BOTH open and close deals

        Args:
            deals: Raw list of MT5 deal objects from history_deals_get()

        Returns:
            Dict mapping position_id → trade data (with open_deal, close_deals, totals)
        """
        # Step 1: Filter trade deals only
        trade_deals = [deal for deal in deals if deal.type in DEAL_TYPES_TRADE]
        non_trade_count = len(deals) - len(trade_deals)
        if non_trade_count > 0:
            logger.info(f"[NORMALIZE] Filtered out {non_trade_count} non-trade deals "
                         f"(balance, credit, etc.)")

        # Step 2: Separate open and close
        open_deals = [deal for deal in trade_deals if deal.entry == DEAL_ENTRY_IN]
        close_deals = [deal for deal in trade_deals if deal.entry == DEAL_ENTRY_OUT]
        logger.info(f"[NORMALIZE] Deal separation: {len(open_deals)} open (ENTRY_IN), "
                     f"{len(close_deals)} close (ENTRY_OUT)")

        # Step 3: Group by position_id
        trades_dict = {}

        for deal in open_deals:
            position_id = deal.position_id
            if position_id not in trades_dict:
                trades_dict[position_id] = {
                    'open_deal': deal,
                    'close_deals': [],
                    'total_profit': 0.0,
                    'total_swap': 0.0,
                    'total_commission': 0.0,
                    'open_time': deal.time,
                    'close_time': None,
                    'symbol': deal.symbol,
                }
            else:
                # Multiple open deals for same position — use earliest
                if deal.time < trades_dict[position_id]['open_time']:
                    trades_dict[position_id]['open_deal'] = deal
                    trades_dict[position_id]['open_time'] = deal.time
                    trades_dict[position_id]['symbol'] = deal.symbol

        # Step 4: Match close deals and accumulate financials
        for deal in close_deals:
            position_id = deal.position_id
            if position_id in trades_dict:
                trades_dict[position_id]['close_deals'].append(deal)
                trades_dict[position_id]['total_profit'] += deal.profit
                trades_dict[position_id]['total_commission'] += (
                    deal.commission + getattr(deal, 'fee', 0.0)
                )
                trades_dict[position_id]['total_swap'] += deal.swap
                if (trades_dict[position_id]['close_time'] is None or
                        deal.time > trades_dict[position_id]['close_time']):
                    trades_dict[position_id]['close_time'] = deal.time
            else:
                logger.warning(f"[NORMALIZE] Orphan close deal: position_id={position_id}, "
                               f"ticket={deal.ticket} — no matching open deal found")

        # Step 5: Filter to complete trades only
        complete_trades = {
            pid: data for pid, data in trades_dict.items()
            if data['close_time'] is not None
        }

        incomplete = len(trades_dict) - len(complete_trades)
        if incomplete > 0:
            logger.info(f"[NORMALIZE] {incomplete} positions still open (no close deal yet)")
        logger.info(f"[NORMALIZE] Result: {len(complete_trades)} complete paired trades")

        return complete_trades

    @staticmethod
    def transform_to_contract(position_id: int, trade_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform a paired trade into CONTRACT.md Section 4.2 JSON format.

        Args:
            position_id: The MT5 position_id
            trade_data: Output from pair_open_close_deals()

        Returns:
            Dict matching CONTRACT.md closed trade schema
        """
        open_deal = trade_data['open_deal']
        close_deals = trade_data['close_deals']
        main_close_deal = close_deals[-1] if close_deals else open_deal

        # Lookup TP/SL from order history
        order_ticket = getattr(open_deal, 'order', None) or getattr(open_deal, 'ticket', None)
        tp, sl = DataNormalizer.get_tp_sl_from_order(order_ticket)

        # Convert timestamps: Unix → ISO 8601 UTC
        open_time_iso = datetime.utcfromtimestamp(
            trade_data['open_time']).strftime('%Y-%m-%dT%H:%M:%SZ')
        close_time_iso = datetime.utcfromtimestamp(
            trade_data['close_time']).strftime('%Y-%m-%dT%H:%M:%SZ')

        # Financial calculations
        profit = trade_data['total_profit']
        commission = trade_data['total_commission']
        swap = trade_data['total_swap']
        net_profit = profit + commission + swap

        # Map type enum → string
        trade_type = "BUY" if open_deal.type == mt5.DEAL_TYPE_BUY else "SELL"

        result = {
            "ticket": open_deal.ticket,
            "order_id": order_ticket,
            "deal_in_id": open_deal.ticket,
            "deal_out_id": main_close_deal.ticket,
            "position_id": position_id,
            "symbol": trade_data['symbol'],
            "trade_type": trade_type,
            "volume": open_deal.volume,
            "open_price": getattr(open_deal, 'price', 0.0),
            "close_price": getattr(main_close_deal, 'price', 0.0),
            "stop_loss": sl,       # null if not set (per CONTRACT)
            "take_profit": tp,     # null if not set (per CONTRACT)
            "open_time": open_time_iso,
            "close_time": close_time_iso,
            "profit": round(profit, 2),
            "commission": round(commission, 2),
            "swap": round(swap, 2),
            "net_profit": round(net_profit, 2),
            "magic_number": getattr(open_deal, 'magic', 0),
            "comment": getattr(main_close_deal, 'comment', ""),
            "duration_seconds": DataNormalizer.calculate_duration_seconds(
                trade_data['open_time'], trade_data['close_time'])
        }

        logger.debug(f"[NORMALIZE] Trade {position_id}: {trade_type} {result['symbol']} "
                      f"vol={result['volume']} net={net_profit:.2f} "
                      f"dur={result['duration_seconds']}s")
        return result

    @staticmethod
    def normalize_positions(positions: tuple) -> List[Dict]:
        """
        Normalize open positions to CONTRACT.md Section 4.3 format.

        Args:
            positions: Tuple from mt5.positions_get()

        Returns:
            List of position dicts with nullable SL/TP
        """
        normalized = []
        if not positions:
            logger.info("[NORMALIZE] No open positions")
            return normalized

        for pos in positions:
            open_time_iso = datetime.utcfromtimestamp(pos.time).strftime('%Y-%m-%dT%H:%M:%SZ')
            trade_type = "BUY" if pos.type == mt5.POSITION_TYPE_BUY else "SELL"
            normalized.append({
                "ticket": pos.ticket,
                "symbol": pos.symbol,
                "trade_type": trade_type,
                "volume": pos.volume,
                "open_price": pos.price_open,
                "current_price": pos.price_current,
                "stop_loss": pos.sl if pos.sl > 0 else None,    # 0 → null
                "take_profit": pos.tp if pos.tp > 0 else None,  # 0 → null
                "open_time": open_time_iso,
                "floating_profit": pos.profit,
                "commission": 0.0,  # Not settled until close
                "swap": pos.swap
            })

        logger.info(f"[NORMALIZE] Normalized {len(normalized)} open positions")
        return normalized
