package main

import (
	"os"
	"reflect"
	"testing"

	"go.mongodb.org/mongo-driver/mongo/options"
)

func TestClientOptions(t *testing.T) {
	os.Setenv("profile", "prod")
	want := options.Client().ApplyURI("mongodb://db:27017")
	got := clientOptions()
	if !reflect.DeepEqual(got.GetURI(), want.GetURI()) {
		t.Errorf("clientOptions() got = %v, want %v", got, want)
	}
}

func TestClientOptionsNonProdProfile(t *testing.T) {
	os.Setenv("profile", "dev")
	want := options.Client().ApplyURI("mongodb://localhost:27017")

	got := clientOptions()

	if !reflect.DeepEqual(got.GetURI(), want.GetURI()) {
		t.Errorf("clientOptions() got = %v, want %v", got, want)
	}
}

func TestNormalizeSkill(t *testing.T) {
	got := normalizeSkill("  GoLang  ")
	if got != "golang" {
		t.Errorf("normalizeSkill() got = %q, want %q", got, "golang")
	}
}
