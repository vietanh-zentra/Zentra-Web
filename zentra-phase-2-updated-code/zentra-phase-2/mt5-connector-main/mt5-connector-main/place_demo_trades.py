"""
Place demo trades on MT5 to generate trade history for testing.
Uses Master password (not Investor) because Investor is read-only.
"""
import MetaTrader5 as mt5
import time

# Init with MASTER password (Investor password cannot place trades)
mt5.initialize(
    path='C:\\Program Files\\MetaTrader 5\\terminal64.exe',
    login=5049421223,
    password='W@JpEl7n',
    server='MetaQuotes-Demo',
    timeout=30000
)

info = mt5.account_info()
print(f"Account: {info.login}, Balance: {info.balance} {info.currency}")

# BUY 0.01 EURUSD
symbol = "EURUSD"
mt5.symbol_select(symbol, True)
time.sleep(0.5)
tick = mt5.symbol_info_tick(symbol)
print(f"{symbol}: Bid={tick.bid}, Ask={tick.ask}")

request_buy = {
    "action": mt5.TRADE_ACTION_DEAL,
    "symbol": symbol,
    "volume": 0.01,
    "type": mt5.ORDER_TYPE_BUY,
    "price": tick.ask,
    "sl": round(tick.ask - 0.0050, 5),
    "tp": round(tick.ask + 0.0050, 5),
    "deviation": 20,
    "magic": 12345,
    "comment": "zentra_test_buy",
    "type_time": mt5.ORDER_TIME_GTC,
    "type_filling": mt5.ORDER_FILLING_IOC,
}
result_buy = mt5.order_send(request_buy)
print(f"BUY result: retcode={result_buy.retcode}, order={result_buy.order}")

time.sleep(1)

# SELL 0.01 GBPUSD
symbol2 = "GBPUSD"
mt5.symbol_select(symbol2, True)
time.sleep(0.5)
tick2 = mt5.symbol_info_tick(symbol2)
print(f"{symbol2}: Bid={tick2.bid}, Ask={tick2.ask}")

request_sell = {
    "action": mt5.TRADE_ACTION_DEAL,
    "symbol": symbol2,
    "volume": 0.01,
    "type": mt5.ORDER_TYPE_SELL,
    "price": tick2.bid,
    "sl": round(tick2.bid + 0.0050, 5),
    "tp": round(tick2.bid - 0.0050, 5),
    "deviation": 20,
    "magic": 12345,
    "comment": "zentra_test_sell",
    "type_time": mt5.ORDER_TIME_GTC,
    "type_filling": mt5.ORDER_FILLING_IOC,
}
result_sell = mt5.order_send(request_sell)
print(f"SELL result: retcode={result_sell.retcode}, order={result_sell.order}")

# Check open positions
time.sleep(1)
positions = mt5.positions_get()
print(f"\nOpen positions: {len(positions) if positions else 0}")
if positions:
    for p in positions:
        typ = "BUY" if p.type == 0 else "SELL"
        print(f"  {p.symbol} {typ} vol={p.volume} profit={p.profit}")

# Now close them to create closed trade history
time.sleep(2)
print("\nClosing positions to generate trade history...")

if positions:
    for p in positions:
        close_type = mt5.ORDER_TYPE_SELL if p.type == 0 else mt5.ORDER_TYPE_BUY
        tick_close = mt5.symbol_info_tick(p.symbol)
        close_price = tick_close.bid if p.type == 0 else tick_close.ask

        close_req = {
            "action": mt5.TRADE_ACTION_DEAL,
            "symbol": p.symbol,
            "volume": p.volume,
            "type": close_type,
            "position": p.ticket,
            "price": close_price,
            "deviation": 20,
            "magic": 12345,
            "comment": "zentra_close",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        result_close = mt5.order_send(close_req)
        print(f"  Close {p.symbol}: retcode={result_close.retcode}")

time.sleep(1)
remaining = mt5.positions_get()
print(f"\nRemaining positions: {len(remaining) if remaining else 0}")
print("Done! Trade history should now be available.")

mt5.shutdown()
