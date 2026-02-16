package models

import "time"

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Username  string `gorm:"unique;not null"`
	Password  string
	ImageURL  string `gorm:"type:text" json:"imageUrl"`
	Bio       string `gorm:"type:text" json:"bio"`
	Rating    int    `gorm:"not null;default:1000" json:"rating"`
	Wins      int    `gorm:"not null;default:0" json:"wins"`
	Losses    int    `gorm:"not null;default:0" json:"losses"`
	CreatedAt time.Time
}
