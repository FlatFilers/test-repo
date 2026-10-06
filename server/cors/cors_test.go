package cors

import (
	"io"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDisable(t *testing.T) {
	writer := httptest.NewRecorder()
	handler := func(w http.ResponseWriter, r *http.Request) {
		io.WriteString(w, "test")
	}
	handler = Disable(handler)

	handler(writer, nil)

	if got := writer.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Errorf("Expected Access-Control-Allow-Origin = *, got = %s", got)
	}
	allowedMethods := writer.Header().Get("Access-Control-Allow-Methods")
	for _, method := range []string{"PATCH", "OPTIONS"} {
		if !strings.Contains(allowedMethods, method) {
			t.Errorf("Expected Access-Control-Allow-Methods to contain %s, got = %s", method, allowedMethods)
		}
	}
	if got := writer.Header().Get("Access-Control-Allow-Headers"); got != "*" {
		t.Errorf("Expected Access-Control-Allow-Headers = *, got = %s", got)
	}
	if body, _ := ioutil.ReadAll(writer.Result().Body); string(body) != "test" {
		t.Errorf("Original handler has not been invoked")
	}
}
