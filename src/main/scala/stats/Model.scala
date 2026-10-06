package stats

case class Player(
    id: String,
    name: String,
    team: String,
    leagueId: String,
    leagueName: String,
    goals: Int,
    assists: Int
):
  def scorerPoints: Int = goals + assists

case class League(id: String, name: String, players: Vector[Player])

object Model:
  // Das Minuszeichen sorgt dafür, dass die höchsten Werte zuerst kommen.
  def topPlayers(players: Vector[Player], metric: String, limit: Int = 15): Vector[Player] =
    val key = metric.trim.toLowerCase
    val sorted = key match
      case "goals" =>
        players.sortBy(player => (-player.goals, -player.assists, player.name.toLowerCase))
      case "assists" =>
        players.sortBy(player => (-player.assists, -player.goals, player.name.toLowerCase))
      case "points" | "scorer" | "scorerpoints" =>
        players.sortBy(player => (-player.scorerPoints, -player.goals, player.name.toLowerCase))
      case _ =>
        players.sortBy(player => (-player.scorerPoints, -player.goals, player.name.toLowerCase))
    sorted.take(limit)

  def searchPlayers(players: Vector[Player], query: String): Vector[Player] =
    val needle = query.trim.toLowerCase
    if needle.isEmpty then Vector.empty
    else
      players.filter { player =>
        player.name.toLowerCase.contains(needle) ||
          player.team.toLowerCase.contains(needle)
      }

  // copy erstellt einen neuen Spieler. Der alte bleibt unverändert.
  def updateStats(player: Player, newGoals: Int, newAssists: Int): Player =
    player.copy(goals = newGoals, assists = newAssists)
