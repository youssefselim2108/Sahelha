"""Train and compare the request classifiers (D12, FR-AI), then save the best one.

Every model uses the same features: TF-IDF over character n-grams (2–5, word-bounded),
which copes with Egyptian Arabic spelling variation and mixed Arabic/English text.

Evaluation:
  * stratified 75/25 hold-out split (seed 42): accuracy, macro precision / recall / F1,
    per-language accuracy, per-class report and confusion matrix of the best model
  * stratified 5-fold cross-validation on the full set: macro F1 mean ± std

Outputs: model.joblib, results/metrics.json, results/confusion_matrix.png
"""
import json
from pathlib import Path

import joblib
import matplotlib
import pandas as pd
from sklearn.dummy import DummyClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             ConfusionMatrixDisplay, precision_recall_fscore_support)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from sklearn.svm import LinearSVC

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
from matplotlib.colors import LinearSegmentedColormap  # noqa: E402

HERE = Path(__file__).parent
OUT = HERE / "results"
SEED = 42


def features():
    return TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, min_df=1)


MODELS = {
    "Majority baseline": lambda: make_pipeline(features(), DummyClassifier(strategy="most_frequent")),
    "Multinomial Naive Bayes": lambda: make_pipeline(features(), MultinomialNB(alpha=0.1)),
    "Logistic Regression": lambda: make_pipeline(features(), LogisticRegression(C=10, max_iter=2000)),
    "Linear SVM": lambda: make_pipeline(features(), LinearSVC(C=1.0)),
}


def main():
    df = pd.read_csv(HERE / "data" / "requests.csv")
    X, y = df["text"], df["label"]
    X_tr, X_te, y_tr, y_te, lang_tr, lang_te = train_test_split(
        X, y, df["lang"], test_size=0.25, stratify=y, random_state=SEED)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)

    results, fitted = {}, {}
    for name, build in MODELS.items():
        model = build().fit(X_tr, y_tr)
        pred = model.predict(X_te)
        p, r, f1, _ = precision_recall_fscore_support(y_te, pred, average="macro", zero_division=0)
        cv_f1 = cross_val_score(build(), X, y, cv=cv, scoring="f1_macro")
        results[name] = {
            "accuracy": round(accuracy_score(y_te, pred), 3),
            "precision_macro": round(p, 3),
            "recall_macro": round(r, 3),
            "f1_macro": round(f1, 3),
            "accuracy_arabic": round(accuracy_score(y_te[lang_te == "ar"], pred[lang_te.values == "ar"]), 3),
            "accuracy_english": round(accuracy_score(y_te[lang_te == "en"], pred[lang_te.values == "en"]), 3),
            "cv5_f1_macro_mean": round(cv_f1.mean(), 3),
            "cv5_f1_macro_std": round(cv_f1.std(), 3),
        }
        fitted[name] = (model, pred)

    best = max((n for n in MODELS if n != "Majority baseline"),
               key=lambda n: (results[n]["cv5_f1_macro_mean"], results[n]["f1_macro"]))
    model, pred = fitted[best]

    OUT.mkdir(exist_ok=True)
    labels = sorted(y.unique())
    fig, ax = plt.subplots(figsize=(8, 7))
    ConfusionMatrixDisplay(confusion_matrix(y_te, pred, labels=labels), display_labels=labels).plot(
        ax=ax, cmap=LinearSegmentedColormap.from_list("sahelha", ["#FFFFFF", "#1F7A72"]),  # deck accent colour
        colorbar=False, xticks_rotation=45)
    ax.set_title(f"{best}: hold-out confusion matrix (n={len(y_te)})")
    fig.tight_layout()
    fig.savefig(OUT / "confusion_matrix.png", dpi=160)

    summary = {
        "dataset": {"total": len(df), "train": len(X_tr), "test": len(X_te), "classes": len(labels),
                    "per_class": int(y.value_counts().min()), "languages": df["lang"].value_counts().to_dict()},
        "features": "TF-IDF char_wb n-grams (2-5)",
        "best_model": best,
        "models": results,
        "best_per_class": classification_report(y_te, pred, output_dict=True, zero_division=0),
    }
    (OUT / "metrics.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")

    # Ship the best model retrained on all labelled data
    joblib.dump(MODELS[best]().fit(X, y), HERE / "model.joblib")

    print(f"{'model':26} acc   P     R     F1    CV-F1")
    for n, m in results.items():
        print(f"{n:26} {m['accuracy']:.3f} {m['precision_macro']:.3f} {m['recall_macro']:.3f} "
              f"{m['f1_macro']:.3f} {m['cv5_f1_macro_mean']:.3f}±{m['cv5_f1_macro_std']:.3f}")
    print(f"best: {best}")


if __name__ == "__main__":
    main()
