package services

import (
	"errors"
	"fmt"
	"time"

	"example.com/mathkun-tmp-/server/models"
	"example.com/mathkun-tmp-/server/repositories"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// 認証関連のエラー定数
var (
	ErrInvalidCredentials = errors.New("invalid username or password") // ログイン失敗時のエラー
	ErrUsernameTaken      = errors.New("username already taken")       // 登録時にユーザー名が重複
)

// AuthService はアカウント登録とログインの処理をまとめる
// パスワードのハッシュ化、JWT発行などを担当
type AuthService struct {
	repo      *repositories.UserRepository // ユーザーDB操作用リポジトリ
	jwtSecret string                       // JWT署名用の秘密鍵
}

// UserClaims はJWTに埋め込むユーザー情報
// トークンをパースすることでログイン中のユーザー名を取得できる
type UserClaims struct {
	Username string `json:"username"` // ユーザー名（認証に使う主キー）
	jwt.RegisteredClaims              // 標準クレーム（exp, iat, subなど）
}

// NewAuthService は依存関係を受け取り、サービスを組み立てる
// main.goで一度だけ呼ばれ、ハンドラ層に渡される
func NewAuthService(repo *repositories.UserRepository, jwtSecret string) *AuthService {
	return &AuthService{
		repo:      repo,
		jwtSecret: jwtSecret,
	}
}

// SignUp はユーザーを作成し、保存結果を返す
// パスワードはbcryptでハッシュ化して保存（平文は保存しない）
func (s *AuthService) SignUp(username, password string) (*models.User, error) {
	// 空文字チェック（ユーザー名もパスワードも必須）
	if username == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	// 既存チェックを先に行い、同名ユーザーの作成を防ぐ
	// DBに同じusernameが既に存在していないか確認
	existing, err := s.repo.FindByUsername(username)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		// 既に存在する場合はエラーを返す
		return nil, ErrUsernameTaken
	}

	// bcryptでパスワードをハッシュ化（不可逆変換）
	// bcrypt.DefaultCost = 10（計算コスト、セキュリティと速度のバランス）
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 新規ユーザーモデルを作成
	user := &models.User{
		Username: username,
		Password: string(hashedPassword), // ハッシュ化されたパスワードを保存
		// Rating, Wins, Lossesは models.User の初期値（1500, 0, 0）が使われる
	}

	// DBに保存（usersテーブルにINSERT）
	if err := s.repo.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}

// Login は認証に成功するとJWTを発行して返す
// ユーザー名とパスワードを検証し、トークン文字列を返す
func (s *AuthService) Login(username, password string) (string, error) {
	// 空文字チェック（どちらも必須）
	if username == "" || password == "" {
		return "", ErrInvalidCredentials
	}

	// ユーザー取得に失敗した場合は認証失敗として扱う
	// DBからユーザー名でユーザー情報を検索
	user, err := s.repo.FindByUsername(username)
	if err != nil {
		return "", err
	}
	if user == nil {
		// ユーザーが存在しない場合も認証失敗
		return "", ErrInvalidCredentials
	}

	// 送信されたパスワードと保存済みハッシュを照合する
	// bcrypt.CompareHashAndPassword はハッシュと平文パスワードを比較
	// ハッシュが一致すればnil、不一致ならエラーを返す
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", ErrInvalidCredentials
	}

	// 認証成功：最低限の情報だけJWTに詰める
	claims := UserClaims{
		Username: user.Username, // ユーザー名（後でこれを取り出して認証に使う）
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),                        // ユーザーID（文字列化）
			IssuedAt:  jwt.NewNumericDate(time.Now()),                    // 発行日時
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // 有効期限（24時間後）
		},
	}

	// HMAC-SHA256でトークンに署名
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	// 署名してトークン文字列を生成（例: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."）
	return token.SignedString([]byte(s.jwtSecret))
}
