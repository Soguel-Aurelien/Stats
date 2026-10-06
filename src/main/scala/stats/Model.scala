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
  def scorerPoints(player: Player): Int = player.goals + player.assists

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
    val needle = query.trim
    if needle.isEmpty then Vector.empty
    else
      players.filter { player =>
        player.name.toLowerCase.contains(needle.toLowerCase) ||
          player.team.toLowerCase.contains(needle.toLowerCase)
      }

  def updateGoals(player: Player, newGoals: Int): Player = player.copy(goals = newGoals)

  def updateAssists(player: Player, newAssists: Int): Player = player.copy(assists = newAssists)

  def updateStats(player: Player, newGoals: Int, newAssists: Int): Player =
    player.copy(goals = newGoals, assists = newAssists)

  def findLeague(leagues: Vector[League], leagueId: String): Option[League] =
    leagues.find(_.id == leagueId)
