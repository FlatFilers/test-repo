package db

import (
	"go.mongodb.org/mongo-driver/bson"
	"reflect"
	"testing"
)

func TestFilter(t *testing.T) {
	mongoDB := MongoDB{}

	tests := []struct {
		name  string
		skill string
		want  string
	}{
		// Regression guard: plain input must remain byte-identical after
		// escaping was introduced, proving ordinary searches are unaffected.
		{"plain text is unchanged", "test", "^test.*$"},
		// "+" is a regex quantifier. Unescaped, "C++" reads as "C" repeated
		// and wrongly matches "C#" and "CSS" holders too.
		{"metacharacter-heavy skill name", "C++", "^C\\+\\+.*$"},
		// An unbalanced "(" is invalid regex syntax and makes Mongo reject
		// the query outright, which surfaces to the user as a hard error.
		{"unbalanced paren", "(", "^\\(.*$"},
		// "." is a wildcard; it happens to also match its own literal here,
		// but it must still be escaped so it can't match arbitrary characters.
		{"dot in skill name", "Node.js", "^Node\\.js.*$"},
		// An oversized quantifier is invalid regex and errors in Mongo;
		// escaping the braces turns it into a harmless literal search.
		{"oversized quantifier", "a{99999999,}", "^a\\{99999999,\\}.*$"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := mongoDB.filter(tt.skill)

			want := bson.D{{
				"skills.name",
				bson.D{{
					"$regex",
					tt.want,
				}, {
					"$options",
					"i",
				}},
			}}
			if !reflect.DeepEqual(got, want) {
				t.Errorf("filter(%q) got = %v, want %v", tt.skill, got, want)
			}
		})
	}
}

// TestSkillsPipelineStageOrder asserts the aggregation runs $unwind before
// $match (B3: a document-scoped match would return every skill on a matching
// programmer, not just the ones matching the prefix) and $sort before $limit
// (otherwise the pipeline truncates to an arbitrary set instead of the
// most-used skills).
func TestSkillsPipelineStageOrder(t *testing.T) {
	mongoDB := MongoDB{}

	pipeline := mongoDB.skillsPipeline("go", 10)

	stageName := func(stage bson.D) string {
		if len(stage) == 0 {
			return ""
		}
		return stage[0].Key
	}
	indexOf := func(name string) int {
		for i, stage := range pipeline {
			if stageName(stage) == name {
				return i
			}
		}
		t.Fatalf("pipeline missing stage %q: %v", name, pipeline)
		return -1
	}

	unwind, match := indexOf("$unwind"), indexOf("$match")
	group, sort, limit := indexOf("$group"), indexOf("$sort"), indexOf("$limit")

	if unwind >= match {
		t.Errorf("$unwind must precede $match: got $unwind at %d, $match at %d", unwind, match)
	}
	if sort >= limit {
		t.Errorf("$sort must precede $limit: got $sort at %d, $limit at %d", sort, limit)
	}
	if match >= group {
		t.Errorf("$match must precede $group: got $match at %d, $group at %d", match, group)
	}
}
