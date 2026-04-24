"""
Sample Trade Payloads — Phase 3B Checkpoint

15 sample trade payloads in CONTRACT.md format.
Used for:
  - Dũng test insert vào MongoDB
  - Kiểm tra duplicate, precision, nullable
  - Verify field mapping

Author: Hoà (MT5 Engine Lead)
"""
import json

SAMPLE_TRADES = [
    {
        "ticket": 100001, "order_id": 200001, "deal_in_id": 300001, "deal_out_id": 400001,
        "position_id": 500001, "symbol": "EURUSD", "trade_type": "BUY", "volume": 0.10,
        "open_price": 1.08500, "close_price": 1.08750, "stop_loss": 1.08200, "take_profit": 1.09000,
        "open_time": "2026-04-10T08:30:00Z", "close_time": "2026-04-10T12:45:00Z",
        "profit": 25.00, "commission": -0.70, "swap": 0.00, "net_profit": 24.30,
        "magic_number": 0, "comment": "", "duration_seconds": 15300
    },
    {
        "ticket": 100002, "order_id": 200002, "deal_in_id": 300002, "deal_out_id": 400002,
        "position_id": 500002, "symbol": "GBPUSD", "trade_type": "SELL", "volume": 0.05,
        "open_price": 1.32100, "close_price": 1.32350, "stop_loss": 1.32500, "take_profit": 1.31500,
        "open_time": "2026-04-10T14:00:00Z", "close_time": "2026-04-10T15:30:00Z",
        "profit": -12.50, "commission": -0.35, "swap": 0.00, "net_profit": -12.85,
        "magic_number": 0, "comment": "SL hit", "duration_seconds": 5400
    },
    {
        "ticket": 100003, "order_id": 200003, "deal_in_id": 300003, "deal_out_id": 400003,
        "position_id": 500003, "symbol": "USDJPY", "trade_type": "BUY", "volume": 0.20,
        "open_price": 154.500, "close_price": 154.850, "stop_loss": 154.200, "take_profit": 155.000,
        "open_time": "2026-04-11T02:15:00Z", "close_time": "2026-04-11T06:00:00Z",
        "profit": 45.50, "commission": -1.40, "swap": -0.30, "net_profit": 43.80,
        "magic_number": 0, "comment": "", "duration_seconds": 13500
    },
    {
        "ticket": 100004, "order_id": 200004, "deal_in_id": 300004, "deal_out_id": 400004,
        "position_id": 500004, "symbol": "XAUUSD", "trade_type": "BUY", "volume": 0.01,
        "open_price": 2350.50, "close_price": 2365.80, "stop_loss": 2340.00, "take_profit": 2380.00,
        "open_time": "2026-04-11T09:00:00Z", "close_time": "2026-04-11T16:30:00Z",
        "profit": 15.30, "commission": -0.50, "swap": 0.00, "net_profit": 14.80,
        "magic_number": 0, "comment": "", "duration_seconds": 27000
    },
    {
        "ticket": 100005, "order_id": 200005, "deal_in_id": 300005, "deal_out_id": 400005,
        "position_id": 500005, "symbol": "EURUSD", "trade_type": "SELL", "volume": 0.15,
        "open_price": 1.08900, "close_price": 1.08700, "stop_loss": None, "take_profit": None,
        "open_time": "2026-04-12T10:00:00Z", "close_time": "2026-04-12T10:45:00Z",
        "profit": 30.00, "commission": -1.05, "swap": 0.00, "net_profit": 28.95,
        "magic_number": 0, "comment": "manual close", "duration_seconds": 2700
    },
    {
        "ticket": 100006, "order_id": 200006, "deal_in_id": 300006, "deal_out_id": 400006,
        "position_id": 500006, "symbol": "GBPJPY", "trade_type": "BUY", "volume": 0.03,
        "open_price": 193.200, "close_price": 193.050, "stop_loss": 192.800, "take_profit": 194.000,
        "open_time": "2026-04-12T13:30:00Z", "close_time": "2026-04-12T14:15:00Z",
        "profit": -4.50, "commission": -0.21, "swap": 0.00, "net_profit": -4.71,
        "magic_number": 0, "comment": "", "duration_seconds": 2700
    },
    {
        "ticket": 100007, "order_id": 200007, "deal_in_id": 300007, "deal_out_id": 400007,
        "position_id": 500007, "symbol": "AUDUSD", "trade_type": "BUY", "volume": 0.50,
        "open_price": 0.64200, "close_price": 0.64450, "stop_loss": 0.64000, "take_profit": 0.64500,
        "open_time": "2026-04-13T01:00:00Z", "close_time": "2026-04-13T05:30:00Z",
        "profit": 125.00, "commission": -3.50, "swap": -0.80, "net_profit": 120.70,
        "magic_number": 12345, "comment": "EA trade", "duration_seconds": 16200
    },
    {
        "ticket": 100008, "order_id": 200008, "deal_in_id": 300008, "deal_out_id": 400008,
        "position_id": 500008, "symbol": "USDCAD", "trade_type": "SELL", "volume": 0.10,
        "open_price": 1.38500, "close_price": 1.38200, "stop_loss": 1.38800, "take_profit": 1.37800,
        "open_time": "2026-04-14T08:00:00Z", "close_time": "2026-04-14T20:00:00Z",
        "profit": 21.66, "commission": -0.70, "swap": -1.20, "net_profit": 19.76,
        "magic_number": 0, "comment": "", "duration_seconds": 43200
    },
    {
        "ticket": 100009, "order_id": 200009, "deal_in_id": 300009, "deal_out_id": 400009,
        "position_id": 500009, "symbol": "NZDUSD", "trade_type": "BUY", "volume": 0.08,
        "open_price": 0.59800, "close_price": 0.59600, "stop_loss": 0.59500, "take_profit": 0.60200,
        "open_time": "2026-04-14T22:00:00Z", "close_time": "2026-04-15T03:00:00Z",
        "profit": -16.00, "commission": -0.56, "swap": -0.10, "net_profit": -16.66,
        "magic_number": 0, "comment": "SL hit", "duration_seconds": 18000
    },
    {
        "ticket": 100010, "order_id": 200010, "deal_in_id": 300010, "deal_out_id": 400010,
        "position_id": 500010, "symbol": "EURJPY", "trade_type": "SELL", "volume": 0.12,
        "open_price": 168.500, "close_price": 168.200, "stop_loss": 168.900, "take_profit": 167.800,
        "open_time": "2026-04-15T09:00:00Z", "close_time": "2026-04-15T11:30:00Z",
        "profit": 26.70, "commission": -0.84, "swap": 0.00, "net_profit": 25.86,
        "magic_number": 0, "comment": "", "duration_seconds": 9000
    },
    {
        "ticket": 100011, "order_id": 200011, "deal_in_id": 300011, "deal_out_id": 400011,
        "position_id": 500011, "symbol": "XAUUSD", "trade_type": "SELL", "volume": 0.02,
        "open_price": 2370.00, "close_price": 2375.00, "stop_loss": 2380.00, "take_profit": 2350.00,
        "open_time": "2026-04-15T14:00:00Z", "close_time": "2026-04-15T14:20:00Z",
        "profit": -10.00, "commission": -1.00, "swap": 0.00, "net_profit": -11.00,
        "magic_number": 0, "comment": "SL hit", "duration_seconds": 1200
    },
    {
        "ticket": 100012, "order_id": 200012, "deal_in_id": 300012, "deal_out_id": 400012,
        "position_id": 500012, "symbol": "EURUSD", "trade_type": "BUY", "volume": 0.30,
        "open_price": 1.08200, "close_price": 1.08600, "stop_loss": 1.07900, "take_profit": 1.08800,
        "open_time": "2026-04-16T08:00:00Z", "close_time": "2026-04-16T13:00:00Z",
        "profit": 120.00, "commission": -2.10, "swap": 0.00, "net_profit": 117.90,
        "magic_number": 0, "comment": "", "duration_seconds": 18000
    },
    {
        "ticket": 100013, "order_id": 200013, "deal_in_id": 300013, "deal_out_id": 400013,
        "position_id": 500013, "symbol": "GBPUSD", "trade_type": "BUY", "volume": 0.07,
        "open_price": 1.31800, "close_price": 1.31750, "stop_loss": None, "take_profit": None,
        "open_time": "2026-04-17T15:00:00Z", "close_time": "2026-04-17T15:10:00Z",
        "profit": -3.50, "commission": -0.49, "swap": 0.00, "net_profit": -3.99,
        "magic_number": 0, "comment": "quick scalp loss", "duration_seconds": 600
    },
    {
        "ticket": 100014, "order_id": 200014, "deal_in_id": 300014, "deal_out_id": 400014,
        "position_id": 500014, "symbol": "USDJPY", "trade_type": "SELL", "volume": 0.25,
        "open_price": 155.200, "close_price": 154.800, "stop_loss": 155.500, "take_profit": 154.500,
        "open_time": "2026-04-18T03:00:00Z", "close_time": "2026-04-18T09:30:00Z",
        "profit": 64.52, "commission": -1.75, "swap": -0.50, "net_profit": 62.27,
        "magic_number": 0, "comment": "", "duration_seconds": 23400
    },
    {
        "ticket": 100015, "order_id": 200015, "deal_in_id": 300015, "deal_out_id": 400015,
        "position_id": 500015, "symbol": "EURUSD", "trade_type": "SELL", "volume": 0.10,
        "open_price": 1.08650, "close_price": 1.08680, "stop_loss": 1.08700, "take_profit": 1.08400,
        "open_time": "2026-04-18T14:00:00Z", "close_time": "2026-04-18T14:05:00Z",
        "profit": -3.00, "commission": -0.70, "swap": 0.00, "net_profit": -3.70,
        "magic_number": 0, "comment": "tight SL hit", "duration_seconds": 300
    }
]

if __name__ == "__main__":
    print(f"=== {len(SAMPLE_TRADES)} SAMPLE TRADE PAYLOADS (CONTRACT.md format) ===\n")
    print(json.dumps(SAMPLE_TRADES, indent=2))

    # Quick statistics
    wins = sum(1 for t in SAMPLE_TRADES if t["net_profit"] > 0)
    losses = sum(1 for t in SAMPLE_TRADES if t["net_profit"] <= 0)
    total_net = sum(t["net_profit"] for t in SAMPLE_TRADES)
    nullable_count = sum(1 for t in SAMPLE_TRADES if t["stop_loss"] is None)

    print(f"\n--- Statistics ---")
    print(f"Total trades:  {len(SAMPLE_TRADES)}")
    print(f"Wins:          {wins}")
    print(f"Losses:        {losses}")
    print(f"Net profit:    {total_net:.2f}")
    print(f"Trades with null SL/TP: {nullable_count}")
    print(f"Symbols used:  {len(set(t['symbol'] for t in SAMPLE_TRADES))}")
