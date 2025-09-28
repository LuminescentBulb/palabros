import translate, spacy

es_to_en = translate.Translator(from_lang="es",to_lang="en")
es_nlp = spacy.load("es_core_news_sm")

def dictionary(sentence):
    doc = es_nlp(sentence)
    sentence_parsed = []
    for token in doc:
        s = f"{token.text}"
        if token.is_alpha: 
            s += f" (from lemma {token.lemma_})"
        s += "\n"
        s += f"{token.pos_}."
        if token.is_alpha:
            s += "\n"
            s += f"{token.morph} \n"
            s += f"Translation: {es_to_en.translate(token.text)}"
        sentence_parsed.append((token.idx,s))
    return sentence_parsed

if __name__ == "__main__":
    for s in dictionary("¿Dónde está la biblioteca?"):
        print(s[0])
        print(s[1])
        print()