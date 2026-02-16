package models

import "time"

type Question struct {
	ID        uint   `gorm:"primaryKey"`
	Prompt    string `gorm:"not null"`
	Answer    string `gorm:"not null"`
	CreatedAt time.Time
}

func (Question) TableName() string {
	return "major_text"
}

type RareQuestion struct {
	ID        uint   `gorm:"primaryKey"`
	Prompt    string `gorm:"not null"`
	Answer    string `gorm:"not null"`
	CreatedAt time.Time
}

func (RareQuestion) TableName() string {
	return "rare_text"
}
