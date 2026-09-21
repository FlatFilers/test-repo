package db

import (
	"context"
	"github.com/shpota/skmz/model"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"log"
	"regexp"
)

type DB interface {
	GetProgrammers(skill string) ([]*model.Programmer, error)
	GetSkills(prefix string, limit int) ([]string, error)
}

type MongoDB struct {
	collection *mongo.Collection
}

func New(client *mongo.Client) *MongoDB {
	programmers := client.Database("programmers").Collection("programmers")
	return &MongoDB{
		collection: programmers,
	}
}

func (db MongoDB) GetProgrammers(skill string) ([]*model.Programmer, error) {
	res, err := db.collection.Find(context.TODO(), db.filter(skill))
	if err != nil {
		log.Printf("Error while fetching programmers: %s", err.Error())
		return nil, err
	}
	var p []*model.Programmer
	err = res.All(context.TODO(), &p)
	if err != nil {
		log.Printf("Error while decoding programmers: %s", err.Error())
		return nil, err
	}
	return p, nil
}

// GetSkills returns distinct skill names matching the prefix, most-used first.
func (db MongoDB) GetSkills(prefix string, limit int) ([]string, error) {
	cur, err := db.collection.Aggregate(context.TODO(), db.skillsPipeline(prefix, limit))
	if err != nil {
		log.Printf("Error while fetching skills: %s", err.Error())
		return nil, err
	}
	var rows []struct {
		Name string `bson:"_id"`
	}
	if err := cur.All(context.TODO(), &rows); err != nil {
		log.Printf("Error while decoding skills: %s", err.Error())
		return nil, err
	}
	names := make([]string, 0, len(rows))
	for _, r := range rows {
		names = append(names, r.Name)
	}
	return names, nil
}

// skillsPipeline builds the aggregation used by GetSkills.
//
// $unwind must run before $match: a document-scoped match would return every
// skill on a matching programmer, not just the skills that match the prefix
// (e.g. prefix "go" would also return "Java" and "Rust" because they share a
// document with "Go"). $sort must run before $limit, or the pipeline
// truncates to an arbitrary set of skills instead of the most-used ones.
func (db MongoDB) skillsPipeline(prefix string, limit int) mongo.Pipeline {
	return mongo.Pipeline{
		bson.D{{"$unwind", "$skills"}},
		bson.D{{"$match", db.filter(prefix)}},
		bson.D{{"$group", bson.D{{"_id", "$skills.name"}, {"count", bson.D{{"$sum", 1}}}}}},
		bson.D{{"$sort", bson.D{{"count", -1}, {"_id", 1}}}},
		bson.D{{"$limit", int64(limit)}},
	}
}

// filter builds a case-insensitive prefix match on skill name.
//
// The skill is user input, so it is escaped with regexp.QuoteMeta before being
// embedded in the pattern. Without escaping, a search for "C++" is interpreted
// as the quantifier "C+" and wrongly matches C# and CSS, and a search for "("
// makes MongoDB reject the query outright.
func (db MongoDB) filter(skill string) bson.D {
	return bson.D{{
		"skills.name",
		bson.D{{
			"$regex",
			"^" + regexp.QuoteMeta(skill) + ".*$",
		}, {
			"$options",
			"i",
		}},
	}}
}
