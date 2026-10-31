from adapters.position_adapter import to_position_group
from repositories.player_repository import find_all_players, set_player_position_group

def run():
    without_position = []
    for player in find_all_players():
        position_group = to_position_group(player.get("position"))
        if position_group:
            set_player_position_group(player["external_id"], position_group)
        else:
            without_position.append(f"{player['name']} ({player.get('position')})")

    print(f"Jugadores sin posición válida: {len(without_position)}")
    for player in without_position:
        print(f" - {player}")

if __name__ == "__main__":
    run()
