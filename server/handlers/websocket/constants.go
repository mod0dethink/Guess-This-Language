package websocket

// fallbackLanguages は各問題モード用の言語リスト（フォールバック用）
var fallbackLanguages = []string{
	"English",
	"Spanish",
	"French",
	"German",
	"Italian",
	"Portuguese",
	"Russian",
	"Ukrainian",
	"Polish",
	"Turkish",
	"Arabic",
	"Hindi",
	"Japanese",
	"Korean",
	"Chinese",
	"Vietnamese",
}

// audioMajorLanguages はメジャー言語の音声問題で使う言語リスト
var audioMajorLanguages = []string{
	"English",
	"Spanish",
	"Japanese",
	"Korean",
	"Chinese",
	"German",
	"Italian",
	"Arabic",
	"Indonesian",
	"Hindi",
	"Russian",
	"Turkish",
	"French",
}

// audioRareLanguages は珍しい言語の音声問題で使う言語リスト
var audioRareLanguages = []string{
	"Georgian",
	"Amharic",
	"Welsh",
	"Icelandic",
	"Khmer",
	"Sinhala",
	"Maltese",
	"Mongolian",
}
