"""
Utility script to get mouse coordinates on Windows

Run this script and move your mouse to the desired location.
The coordinates will be printed continuously.
Press Ctrl+C to stop.
"""
import pyautogui
import time
import sys

print("=" * 60)
print("Mouse Coordinate Finder")
print("=" * 60)
print("Move your mouse to the desired location.")
print("Coordinates will be displayed every second.")
print("Press Ctrl+C to stop.")
print("=" * 60)
print()

try:
    while True:
        x, y = pyautogui.position()
        # Get pixel color at cursor position for verification
        try:
            pixel_color = pyautogui.pixel(x, y)
            print(f"Position: ({x:4d}, {y:4d}) | RGB: {pixel_color}", end='\r')
        except Exception:
            print(f"Position: ({x:4d}, {y:4d})", end='\r')
        sys.stdout.flush()
        time.sleep(0.1)  # Update every 100ms
except KeyboardInterrupt:
    x, y = pyautogui.position()
    print(f"\n\nFinal coordinates: ({x}, {y})")
    print("Copy these coordinates to use in your automation code.")

