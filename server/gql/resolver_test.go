package gql

import (
	"context"
	"errors"
	"github.com/shpota/skmz/db"
	"github.com/shpota/skmz/model"
	"go.mongodb.org/mongo-driver/mongo"
	"testing"
)

type MockDB struct {
	collection *mongo.Collection
}

func (mockDB MockDB) GetProgrammers(string) ([]*model.Programmer, error) {
	return []*model.Programmer{{ID: "test-id"}}, errors.New("test-error")
}

func TestQuery(t *testing.T) {
	tests := []struct {
		name string
		db   db.DB
	}{
		{name: "nil db", db: nil},
		{name: "mock db", db: MockDB{}},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r := &Resolver{DB: tt.db}

			got := r.Query()

			qr, ok := got.(*queryResolver)
			if !ok {
				t.Fatalf("Query() returned %T, want *queryResolver", got)
			}
			if qr.Resolver != r {
				t.Errorf("Query().Resolver = %v, want %v", qr.Resolver, r)
			}
		})
	}
}

func TestProgrammers(t *testing.T) {
	r := &queryResolver{
		Resolver: &Resolver{&MockDB{}},
	}

	programmers, err := r.Programmers(context.TODO(), "test")

	if programmers[0].ID != "test-id" {
		t.Errorf("GetProgrammers() got = %v, want test-id", programmers[0].ID)
	}
	if err.Error() != "test-error" {
		t.Errorf("GetProgrammers() got = %v, want test-error", err.Error())
	}
}
