"""
ZENTRA Phase 2 — Broker Discovery / Server Scanner
====================================================
Scans MT5 terminal to discover available broker servers.
Used for validating broker_registry.json and discovering new servers.

Usage:
    python broker_discovery.py                     # List all known servers
    python broker_discovery.py --scan              # Scan MT5 terminal for servers
    python broker_discovery.py --validate icmarkets # Validate specific broker servers

Author: Đàm Văn Hoà
Date: April 2026
"""

import json
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# Path to broker_registry.json (relative to project root)
REGISTRY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'src', 'data', 'broker_registry.json'
)


def load_registry():
    """Load broker registry from JSON file."""
    try:
        with open(REGISTRY_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.error(f"Registry not found at {REGISTRY_PATH}")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in registry: {e}")
        return []


def get_registry_stats():
    """Get statistics about the broker registry."""
    brokers = load_registry()
    if not brokers:
        return {'total': 0, 'brokers': 0, 'propfirms': 0, 'servers': 0}

    broker_count = sum(1 for b in brokers if b.get('type') == 'broker')
    propfirm_count = sum(1 for b in brokers if b.get('type') == 'propfirm')
    total_servers = sum(len(b.get('servers', [])) for b in brokers)
    regions = list(set(b.get('region', 'unknown') for b in brokers))

    return {
        'total': len(brokers),
        'brokers': broker_count,
        'propfirms': propfirm_count,
        'total_servers': total_servers,
        'regions': regions,
        'avg_servers_per_broker': round(total_servers / max(1, len(brokers)), 1),
    }


def search_broker(query):
    """Search for a broker by name (case-insensitive)."""
    brokers = load_registry()
    q = query.lower()
    return [
        b for b in brokers
        if q in b.get('name', '').lower()
        or q in b.get('display_name', '').lower()
        or q in b.get('id', '').lower()
    ]


def get_servers_for_broker(broker_id):
    """Get all servers for a specific broker."""
    brokers = load_registry()
    for b in brokers:
        if b.get('id') == broker_id:
            return b.get('servers', [])
    return None


def scan_mt5_servers():
    """
    Scan MT5 terminal for available broker servers.
    Requires MT5 terminal to be installed and MetaTrader5 package.
    Returns list of discovered servers.
    """
    try:
        import MetaTrader5 as mt5
    except ImportError:
        logger.warning("MetaTrader5 package not installed. Cannot scan servers.")
        return {
            'success': False,
            'error': 'MetaTrader5 package not installed',
            'servers': []
        }

    if not mt5.initialize():
        logger.warning("Cannot initialize MT5 terminal for scanning.")
        return {
            'success': False,
            'error': 'MT5 terminal not available or not installed',
            'servers': []
        }

    try:
        # Get terminal info to check MT5 is running
        terminal_info = mt5.terminal_info()
        if terminal_info is None:
            return {
                'success': False,
                'error': 'Cannot get terminal info',
                'servers': []
            }

        # MT5 Python API doesn't directly expose server list scanning,
        # but we can get the currently connected server
        account_info = mt5.account_info()
        current_server = account_info.server if account_info else None

        result = {
            'success': True,
            'terminal_path': terminal_info.path,
            'terminal_build': terminal_info.build,
            'current_server': current_server,
            'note': 'Full server scanning requires MT5 terminal File > Open Account > Scan',
            'scanned_at': datetime.utcnow().isoformat() + 'Z'
        }

        return result

    finally:
        mt5.shutdown()


def validate_broker_connection(broker_id, account_id=None, password=None):
    """
    Validate that a broker's servers are reachable.
    If account credentials provided, attempts actual connection.
    Otherwise, just checks if server names are properly formatted.
    """
    servers = get_servers_for_broker(broker_id)
    if servers is None:
        return {
            'broker_id': broker_id,
            'found': False,
            'error': f"Broker '{broker_id}' not found in registry"
        }

    results = []
    for server in servers:
        server_name = server.get('name', '')
        server_type = server.get('type', 'unknown')

        # Basic format validation
        is_valid_format = (
            len(server_name) > 3
            and '-' in server_name
            and not server_name.startswith('-')
            and not server_name.endswith('-')
        )

        result = {
            'server': server_name,
            'type': server_type,
            'format_valid': is_valid_format,
        }

        # If credentials provided, try actual connection
        if account_id and password and is_valid_format:
            try:
                import MetaTrader5 as mt5
                if mt5.initialize():
                    login_result = mt5.login(int(account_id), password=password, server=server_name)
                    result['connection_tested'] = True
                    result['connection_success'] = login_result
                    if not login_result:
                        result['mt5_error'] = mt5.last_error()
                    mt5.shutdown()
                else:
                    result['connection_tested'] = False
                    result['error'] = 'MT5 terminal not available'
            except ImportError:
                result['connection_tested'] = False
                result['error'] = 'MetaTrader5 package not installed'
        else:
            result['connection_tested'] = False

        results.append(result)

    return {
        'broker_id': broker_id,
        'found': True,
        'server_count': len(servers),
        'results': results,
        'validated_at': datetime.utcnow().isoformat() + 'Z'
    }


# ─── CLI ENTRY POINT ─────────────────────────────────────────────────────

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Zentra Broker Discovery Tool')
    parser.add_argument('--stats', action='store_true', help='Show registry statistics')
    parser.add_argument('--search', type=str, help='Search broker by name')
    parser.add_argument('--servers', type=str, help='List servers for broker ID')
    parser.add_argument('--scan', action='store_true', help='Scan MT5 terminal')
    parser.add_argument('--validate', type=str, help='Validate broker server formats')
    args = parser.parse_args()

    if args.stats or not any(vars(args).values()):
        stats = get_registry_stats()
        print(f"\n=== Broker Registry Stats ===")
        print(f"  Total entries:  {stats['total']}")
        print(f"  Brokers:        {stats['brokers']}")
        print(f"  Prop Firms:     {stats['propfirms']}")
        print(f"  Total servers:  {stats['total_servers']}")
        print(f"  Avg servers:    {stats['avg_servers_per_broker']}")
        print(f"  Regions:        {', '.join(stats.get('regions', []))}")
        print()

    if args.search:
        results = search_broker(args.search)
        print(f"\nSearch results for '{args.search}':")
        for b in results:
            print(f"  [{b['id']}] {b['name']} — {b['type']} ({b['region']}) — {len(b.get('servers', []))} servers")
        if not results:
            print("  No results found.")

    if args.servers:
        servers = get_servers_for_broker(args.servers)
        if servers:
            print(f"\nServers for '{args.servers}':")
            for s in servers:
                print(f"  {s['name']} ({s['type']})")
        else:
            print(f"\nBroker '{args.servers}' not found.")

    if args.scan:
        result = scan_mt5_servers()
        print(f"\nMT5 Scan Result: {json.dumps(result, indent=2)}")

    if args.validate:
        result = validate_broker_connection(args.validate)
        print(f"\nValidation for '{args.validate}':")
        print(json.dumps(result, indent=2))
