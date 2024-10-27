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
}
