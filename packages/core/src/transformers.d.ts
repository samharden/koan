// Ambient shim so core typechecks whether or not the optional embeddings
// dependency is installed. At runtime we dynamic-import it and fall back to
// lexical search if it's absent.
declare module "@xenova/transformers";
