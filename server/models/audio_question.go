package models

type AudioQuestion struct {
	ID       uint   `gorm:"primaryKey"`
	Language string `gorm:"type:varchar(100);not null"`
	AudioURL string `gorm:"type:text;not null"`
}

func (AudioQuestion) TableName() string {
	return "major_audio"
}

type RareAudioQuestion struct {
	ID       uint   `gorm:"primaryKey"`
	Language string `gorm:"type:varchar(100);not null"`
	AudioURL string `gorm:"type:text;not null"`
}

func (RareAudioQuestion) TableName() string {
	return "rare_audio"
}
