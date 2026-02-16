package handlers

import (
	"net/http"
	"os"
	"strings"

	"example.com/mathkun-tmp-/server/db"
	"example.com/mathkun-tmp-/server/repositories"
	"example.com/mathkun-tmp-/server/services"

	"github.com/gin-gonic/gin"
)

// signUpRequest はユーザー登録リクエストの構造
// POST /api/signup のリクエストボディをパースする
type signUpRequest struct {
	Username string `json:"username"` // ユーザー名（必須）
	Password string `json:"password"` // パスワード（必須、ハッシュ化して保存）
}

// loginRequest はログインリクエストの構造
// POST /api/login のリクエストボディをパースする
type loginRequest struct {
	Username string `json:"username"` // ユーザー名（必須）
	Password string `json:"password"` // パスワード（必須、bcryptで検証）
}

// updateAvatarRequest はアバター画像更新リクエストの構造
// PUT /api/me/image のリクエストボディをパースする
type updateAvatarRequest struct {
	ImageURL string `json:"imageUrl"` // 画像URL（必須）
}

// updateProfileRequest はプロフィール更新リクエストの構造
// PATCH /api/me のリクエストボディをパースする（部分更新）
type updateProfileRequest struct {
	ImageURL *string `json:"imageUrl"` // 画像URL（任意、送られたら更新）
	Bio      *string `json:"bio"`      // 自己紹介（任意、送られたら更新）
}

// SignUp はユーザー登録を受け付け、公開情報のみ返す
// POST /api/signup で呼ばれる
func SignUp(c *gin.Context) {
	// JSONリクエストボディをパース
	var req signUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// JSONが不正な形式の場合は400エラー
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// JWT設定はログインにも必要なので、ここで存在チェックする
	// 環境変数からJWT署名用の秘密鍵を取得
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// 秘密鍵が設定されていない場合は500エラー
		c.JSON(http.StatusInternalServerError, gin.H{"error": "JWT secret not configured"})
		return
	}

	// ビジネスロジックはサービス層に投げる
	// パスワードのハッシュ化、重複チェック、DB保存などを実行
	service := newAuthService(secret)
	user, err := service.SignUp(req.Username, req.Password)
	if err != nil {
		// エラーを適切なHTTPステータスに変換して返す
		writeError(c, err)
		return
	}

	// 登録成功：IDとユーザー名のみ返す（パスワードは返さない）
	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
	})
}

// Login は認証に成功するとJWTを返す
// POST /api/login で呼ばれる
func Login(c *gin.Context) {
	// JSONリクエストボディをパース
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// JSONが不正な形式の場合は400エラー
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// 環境変数からJWT署名用の秘密鍵を取得
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// 秘密鍵が設定されていない場合は500エラー
		c.JSON(http.StatusInternalServerError, gin.H{"error": "JWT secret not configured"})
		return
	}

	// 認証とトークン発行はサービス層になげる
	// パスワード検証、JWT生成などを実行
	service := newAuthService(secret)
	token, err := service.Login(req.Username, req.Password)
	if err != nil {
		// 認証失敗時は適切なエラーレスポンスを返す
		writeError(c, err)
		return
	}

	// 認証成功：JWTトークンを返す（クライアントはこれをAuthorizationヘッダーに入れて使う）
	c.JSON(http.StatusOK, gin.H{"token": token})
}

// GetMe は認証済みユーザーの詳細情報を返す
// GET /api/me で呼ばれる（要認証）
func GetMe(c *gin.Context) {
	// Authorizationヘッダーからユーザー名を取り出す
	username, err := usernameFromRequest(c)
	if err != nil {
		// トークンが無効または存在しない場合は401エラー
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// ユーザーサービスを作成してプロフィール情報を取得
	userService := services.NewUserService(db.DB)
	user, err := userService.GetUserProfile(username)
	if err != nil {
		// ユーザーが見つからない場合は401エラー
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// プロフィール情報をJSONで返す
	c.JSON(http.StatusOK, gin.H{
		"username": user.Username,
		"imageUrl": user.ImageURL,
		"bio":      user.Bio,
		"rating":   user.Rating,
	})
}

// GetMyRank は認証済みユーザーの順位情報を返す
// GET /api/me/rank で呼ばれる（要認証）
func GetMyRank(c *gin.Context) {
	// Authorizationヘッダーからユーザー名を取り出す
	username, err := usernameFromRequest(c)
	if err != nil {
		// トークンが無効または存在しない場合は401エラー
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// ユーザーサービスを作成して順位情報を取得
	userService := services.NewUserService(db.DB)
	rankInfo, err := userService.GetUserRank(username)
	if err != nil {
		// 取得失敗時は500エラー
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load rank"})
		return
	}

	// レスポンス用のマップを作成
	resp := gin.H{
		"rating":     rankInfo.Rating,     // レーティング（必須）
		"matchCount": rankInfo.MatchCount, // 試合数（必須）
	}
	// 順位は試合数が足りている場合のみ返す
	if rankInfo.Rank != nil {
		resp["rank"] = *rankInfo.Rank
	}
	c.JSON(http.StatusOK, resp)
}

// GetUserPublic は指定ユーザーの公開プロフィールを返す（認証不要）
// GET /api/users/:username で呼ばれる
func GetUserPublic(c *gin.Context) {
	// URLパラメータからユーザー名を取得（例: /api/users/alice → "alice"）
	username := strings.TrimSpace(c.Param("username"))
	if username == "" {
		// ユーザー名が空の場合は400エラー
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
		return
	}

	// ユーザーサービスを作成して公開プロフィールを取得
	userService := services.NewUserService(db.DB)
	user, err := userService.GetPublicProfile(username)
	if err != nil {
		// ユーザーが見つからない場合は404エラー
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	// 公開情報のみ返す（現在はusernameとimageURLのみ）
	c.JSON(http.StatusOK, gin.H{
		"username": user.Username,
		"imageUrl": user.ImageURL,
	})
}

// UpdateAvatar は認証済みユーザーのアバター画像を更新する
// PUT /api/me/image で呼ばれる（要認証）
func UpdateAvatar(c *gin.Context) {
	// Authorizationヘッダーからユーザー名を取り出す
	username, err := usernameFromRequest(c)
	if err != nil {
		// トークンが無効または存在しない場合は401エラー
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// JSONリクエストボディをパース
	var req updateAvatarRequest
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.ImageURL) == "" {
		// JSONが不正または画像URLが空の場合は400エラー
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// ユーザーサービスを作成して画像URLを更新
	userService := services.NewUserService(db.DB)
	if err := userService.UpdateAvatar(username, strings.TrimSpace(req.ImageURL)); err != nil {
		// 更新失敗時は500エラー
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update image"})
		return
	}

	// 更新成功
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// UpdateProfile は認証済みユーザーのプロフィールをまとめて更新する
// PATCH /api/me で呼ばれる（要認証、部分更新）
func UpdateProfile(c *gin.Context) {
	// Authorizationヘッダーからユーザー名を取り出す
	username, err := usernameFromRequest(c)
	if err != nil {
		// トークンが無効または存在しない場合は401エラー
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	// JSONリクエストボディをパース
	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// JSONが不正な形式の場合は400エラー
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// 少なくとも1つのフィールドが送られている必要がある
	if req.ImageURL == nil && req.Bio == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// 送られてきた文字列フィールドをトリム（前後の空白を除去）
	var trimmedImageURL, trimmedBio *string
	if req.ImageURL != nil {
		trimmed := strings.TrimSpace(*req.ImageURL)
		trimmedImageURL = &trimmed
	}
	if req.Bio != nil {
		trimmed := strings.TrimSpace(*req.Bio)
		trimmedBio = &trimmed
	}

	// ユーザーサービスを作成してプロフィールを部分更新
	userService := services.NewUserService(db.DB)
	updates := services.ProfileUpdateDTO{
		ImageURL: trimmedImageURL, // nullなら更新しない
		Bio:      trimmedBio,      // nullなら更新しない
	}
	if err := userService.UpdateProfile(username, updates); err != nil {
		// 更新失敗時は500エラー
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	// 更新成功
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// newAuthService は認証サービスを組み立てる
// リポジトリとJWT秘密鍵を渡してAuthServiceインスタンスを作成
func newAuthService(secret string) *services.AuthService {
	// ユーザーリポジトリを作成（DB操作用）
	repo := repositories.NewUserRepository(db.DB)
	// 認証サービスを初期化して返す
	return services.NewAuthService(repo, secret)
}

// usernameFromRequest はAuthorizationヘッダーからユーザー名を取り出す
// "Authorization: Bearer <token>" 形式を想定
func usernameFromRequest(c *gin.Context) (string, error) {
	// Authorizationヘッダーを取得（前後の空白を除去）
	authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
	if authHeader == "" {
		// ヘッダーが存在しない場合はエラー
		return "", services.ErrInvalidCredentials
	}
	// "Bearer " プレフィックスがあることを確認
	const prefix = "Bearer "
	if !strings.HasPrefix(authHeader, prefix) {
		// プレフィックスがない場合はエラー（形式不正）
		return "", services.ErrInvalidCredentials
	}
	// "Bearer " を取り除いてトークン文字列を取得
	tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, prefix))
	if tokenString == "" {
		// トークン部分が空の場合はエラー
		return "", services.ErrInvalidCredentials
	}
	// トークンをパースしてユーザー名を取り出す（auth_helpers.goの関数）
	return usernameFromToken(tokenString)
}

// writeError はサービス層のエラーを適切なHTTPステータスに変換する
// エラーの種類に応じて適切なステータスコードとメッセージを返す
func writeError(c *gin.Context, err error) {
	switch err {
	case services.ErrUsernameTaken:
		// ユーザー名が既に使われている場合は409 Conflict
		c.JSON(http.StatusConflict, gin.H{"error": "username already taken"})
	case services.ErrInvalidCredentials:
		// 認証情報が不正な場合は401 Unauthorized
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid username or password"})
	default:
		// その他のエラーは500 Internal Server Error
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	}
}
