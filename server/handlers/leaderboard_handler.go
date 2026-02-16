package handlers

import (
	"net/http"
	"strconv"

	"example.com/mathkun-tmp-/server/db"
	"example.com/mathkun-tmp-/server/services"

	"github.com/gin-gonic/gin"
)

func GetLeaderboard(c *gin.Context) {
	limit := 30
	if raw := c.Query("limit"); raw != "" {
		if v, err := strconv.Atoi(raw); err == nil {
			limit = v
		}
	}

	leaderboardService := services.NewLeaderboardService(db.DB)
	rows, err := leaderboardService.GetTopPlayers(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load leaderboard"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"leaders": rows})
}
