import json
from broker_discovery import validate_broker_connection, load_registry

def validate_top_brokers(limit=20):
    brokers = load_registry()
    top_brokers = brokers[:limit]
    
    print(f"Validating top {len(top_brokers)} brokers...\n")
    
    success_count = 0
    total_servers = 0
    valid_servers = 0
    
    for i, b in enumerate(top_brokers, 1):
        broker_id = b['id']
        name = b['name']
        
        print(f"[{i}/{limit}] Checking {name} ({broker_id})...")
        result = validate_broker_connection(broker_id)
        
        is_all_valid = True
        for s in result.get('results', []):
            total_servers += 1
            if s.get('format_valid'):
                valid_servers += 1
            else:
                is_all_valid = False
                print(f"  [FAIL] Invalid format: {s.get('server')}")
                
        if is_all_valid and result.get('found'):
            success_count += 1
            print(f"  [OK] All {result.get('server_count')} servers have valid format.")
        else:
            print(f"  [WARN] Warning: Some servers might have invalid format.")
            
    print("\n" + "="*40)
    print("VALIDATION SUMMARY")
    print("="*40)
    print(f"Brokers Checked: {limit}")
    print(f"Brokers Fully Valid: {success_count}/{limit}")
    print(f"Total Servers Checked: {total_servers}")
    print(f"Servers with Valid Format: {valid_servers}/{total_servers} ({(valid_servers/max(1, total_servers))*100:.1f}%)")

if __name__ == "__main__":
    validate_top_brokers()
