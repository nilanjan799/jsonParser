export type Token = 
    | {type: 'LeftBrace' | 'RightBrace' | 'LeftBracket' | 'RightBracket' | 'Colon' | 'Comma'}
    | {type: 'String', value: string }
    | {type: 'Number', value: number}
    | {type: 'Boolean', value: boolean}
    | {type: 'Null', value: null};

export function isDigit(char: string): boolean {
    const charCode = char.charCodeAt(0);
    return charCode >= 48 && charCode <= 57;
}