from flask import Blueprint, request, jsonify
from hackathon.db import get_db
import requests


bp = Blueprint("scores", __name__, url_prefix="/scores")


@bp.route("/", methods=("GET",))
def index():
    game = request.args.get("game", "")
    difficulty = request.args.get("difficulty", "")
    error = None
    if game not in ["minesweeper"]:
        error = "invalid or missing game"
    if difficulty not in ["0", "1", "2"]:
        error = "invalid or missing difficulty"
    if error:
        return error, 400
    scores = get_scores(game, int(difficulty))
    return jsonify(scores)


@bp.route("/new", methods=("POST",))
def new():
    game = request.form["game"]
    difficulty = request.form["difficulty"]
    name = request.form["name"]
    score = request.form["score"]
    error = None
    if game not in ["minesweeper"]:
        error = "invalid or missing game"
    if difficulty not in ["0", "1", "2"]:
        error = "invalid or missing difficulty"
    if len(name) > 3 or not name.isalpha():
        error = "invalid name"
    name = name.upper()
    if not score.isdigit():
        error = "invalid score"
    if error:
        return error, 400
    score = int(score)
    new_score = dict(game=game, difficulty=difficulty, name=name, score=score)
    score_saved = save_score(new_score)
    if score_saved:
        return jsonify({"saved": True})
    return jsonify({"saved": False})


def get_scores(game, difficulty):
    scores = get_db().execute(
        "SELECT id, name, score FROM scores WHERE game = ? AND difficulty = ?",
        (game, difficulty,)
    ).fetchall()
    scores = [
        {
            "name": score["name"],
            "score": score["score"],
        }
        for score in scores
    ]
    return jsonify(scores)


def save_score(new_score):
    db = get_db()
    high_scores = db.execute(
        "SELECT id, score FROM scores"
        " WHERE game = ?"
        " AND difficulty = ?"
        " ORDER BY score DESC",
        (new_score["game"], new_score["difficulty"],)
    ).fetchall()
    if len(high_scores) < 20:
        new_high_score(new_score)
        return True
    low_score = high_scores[0]
    if new_score["score"] < low_score["score"]:
        new_high_score(new_score, low_score)
        return True
    return False


def new_high_score(new_score, old_score=None):
    db = get_db()
    if old_score:
        db.execute("DELETE FROM scores WHERE id = ?", (old_score["id"],))
    db.execute(
        "INSERT INTO scores (game, difficulty, name, score)"
        " VALUES (?, ?, ?, ?)",
        (new_score["game"], new_score["difficulty"], new_score["name"], new_score["score"],)
    )
    db.commit()


