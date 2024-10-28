import { Injectable } from '@nestjs/common';
import { isDigit, Token } from './helper';
import { error } from 'console';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  tokenize(json: string) : Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while(pos < json.length){
      const char = json[pos];
      switch(char){
        case '{':{
          tokens.push({type:'LeftBrace'});
          pos++; break;
        }
        case '}':{
          tokens.push({type:'RightBrace'});
          pos++; break;
        }
        case '[':{
          tokens.push({type:'LeftBracket'});
          pos++; break;
        }
        case ']':{
          tokens.push({type:'RightBracket'});
          pos++; break;
        }
        case ':':{
          tokens.push({type:'Colon'});
          pos++; break;
        }
        case ',':{
          tokens.push({type:'Comma'});
          pos++; break;
        }
        case '"':{
          const stringToken = this.extractStringToken(json, pos);
          tokens.push(stringToken.token);
          pos = stringToken.position;
          break;
        }
        case 't':
        case 'f':{
          const boolToken = this.extractStringToken(json, pos);
          tokens.push(boolToken.token);
          pos = boolToken.position;
          break;
        }
        case 'n':{
          const nullToken = this.extractNullToken(json, pos);
          tokens.push(nullToken.token);
          pos = nullToken.postion;
          break;
        }
        default:{
          if(isDigit(char) || char == '-'){
            const numToken = this.extractNumberToken(json, pos);
            tokens.push(numToken.token);
            pos = numToken.postion;
          }
          else if(char === ' ' || char === '\t' || char === '\n' || char === '\r') pos++;
          else throw new Error(`Unexpected character: ${char}`);
        }
      }
    }

    return tokens;
  }

  private extractStringToken(json: string, pos: number): {token: Token, position: number}{
    let result = '';
    pos++;
    while(pos< json.length){
      const char = json[pos];
      if(char === '"') return {token: {type: "String", value: result}, position: pos+1};
      else result += char;
    }
    throw new Error('non terminating string');
  } 

  private extractBoolToken(json: string, pos: number): {token: Token, position: number}{
    try{
      const substr = json.substring(pos, pos+3);
      if(substr === 'true') return {token: {type: 'Boolean', value: true}, position: pos+4};
      else if(json.substring(pos, pos+4) === 'false') return {token: {type: 'Boolean', value: false}, position: pos+5};
      else throw new Error('invalid token');
    }
    catch(error)
    {
      throw new Error((error as Error).message);
    }
  }

  private extractNullToken(json: string, pos: number): {token: Token, postion: number}{
    try{
      if(json.substring(pos, pos+3) === 'null') return {token: {type: 'Null', value: null}, postion: pos+4};
      throw new Error('invalid token');
    }
    catch(error){
      throw new Error((error as Error).message);
    }
  }

  private extractNumberToken(json: string, pos: number): {token: Token, postion: number}{
    let numstring = '';
    let char = json[pos];
    if(char === '-') {
      numstring += char;
      char = json[++pos];
    }
    while(isDigit(char)){
      numstring += char;
      char = json[++pos];      
    }
    
    if(char === '.'){
      numstring += char;
      char = json[++pos];
      while(isDigit(char)){
        numstring += char;
        char = json[++pos];
      }
    }
    
    return {token: {type: 'Number', value: parseFloat(numstring)}, postion: pos};
  }

  parse(json: string): any{
    const tokens = this.tokenize(json);

  }

  private parseValue(tokens: Token[], index: number): any{
    const token = tokens[index];

    switch(token.type){
      case 'String': 
        return this.processStringToken(tokens, index);
      case 'Number':
        return this.processNumToken(tokens, index);
      case 'Boolean':
        return this.processBoolToken(tokens, index);
      case 'Null':
        return {value: null, index: index+1};
      case 'LeftBrace':
        return this.processObject(tokens, index);
      case 'LeftBracket':
        return this.processArray(tokens, index);
      default: 
        throw new Error('unexpected token');
    }
  }

  private processStringToken(tokens: Token[], index: number): {value: string, index: number}{
    const token = tokens[index] as {type: 'String', value: string};
    return {value: token.value, index: index+1};
  }

  private processNumToken(tokens:  Token[], index: number): {value: number, index: number}{
    const token = tokens[index] as {type: 'Number', value: number};
    return {value: token.value, index: index+1};
  }

  private processBoolToken(tokens: Token[], index: number): {value: boolean, index: number}{
    const token = tokens[index] as {type: 'Boolean', value: boolean};
    return {value: token.value, index: index+1};
  }

  private processObject(tokens: Token[], index: number): {value: Record<string, any>, index: number}{
    const result: Record<string, any> = {};
    let currentIndex = index+1; //ignore the leftBrace token

    while(currentIndex < tokens.length){
      const fieldName = this.processStringToken(tokens, currentIndex);
      currentIndex = fieldName.index;

      if(currentIndex >= tokens.length || tokens[currentIndex].type != 'Colon') throw new SyntaxError('error in json');      
      currentIndex++;

      const fieldValue = this.parseValue(tokens, currentIndex);
      result[fieldName.value] = fieldValue.value;
      currentIndex = fieldValue.index;

      if(tokens[currentIndex].type === 'Comma') currentIndex++;
      else if(tokens[currentIndex].type === 'RightBrace') return {value: result, index: currentIndex+1};
      else throw new SyntaxError(`unexpected token at ${currentIndex}`);
    }
    throw new SyntaxError('error in json');
  }

  private processArray(tokens: Token[], index: number): {value: any[], index: number}{
    const result: any[] = [];
    let expectValue = true;

    while(index < tokens.length){
      const currToken = tokens[index];

      if(currToken.type === 'RightBracket'){
        if(expectValue && result.length > 0){
          throw new SyntaxError('error in the array syntax');
        }        
        return {value: result, index: index+1};
      }

      if(currToken.type === 'Comma'){
        if(expectValue || result.length === 0){
          throw new SyntaxError('error in array syntax');
        }
        expectValue = true;
        index++;
        continue;
      }

      if(expectValue){
        const resultValue = this.parseValue(tokens, index);
        result.push(resultValue.value);
        index++;
        expectValue = false;

        if(tokens[index]?.type != 'Comma' && tokens[index]?.type != 'RightBracket'){
          throw new SyntaxError('error in array syntax');
        }
      }
      else throw new SyntaxError('error!');
    }

    throw new SyntaxError('error!');
  }

}
