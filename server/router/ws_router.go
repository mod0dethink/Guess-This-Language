package router

import (
	"example.com/mathkun-tmp-/server/handlers/websocket"
	"github.com/gin-gonic/gin"
)

func SetupWebSocketRoutes(r *gin.Engine) {
	r.GET("/ws", websocket.WebSocket)
}
