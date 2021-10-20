 //declare all main variables 
let input = document.querySelectorAll("input");
let expression = document.getElementById("expression");
let result = document.getElementById("result");
let numbers =[0,1,2,3,4,5,6,7,8,9];
let operations = {
    1 : "+",
    2 : "-",
    3 : "*",
    4 : "/",
};
//onload function with clear and delete functions
onload = ()=>{
  result.innerHTML = 0;
}
function clearAll(){
   expression.innerHTML = "";
   result.innerHTML = 0
}
function Delete(str){
   let arry = String(str).split("");
   arry.pop();
   str = arry.join("");
   expression.innerHTML = str;
}
//buttons and  functionality methods
function isNum(nbr){
  for(let i in numbers){
      if(nbr==i)
      return true;
  }
  return false;
}
function checkValidateExpression(data){
    try{
        var s = eval(data);
        if(s.includes("NaN")||s.includes("Infinity"))
        return false;
        return true;
        }catch(err){
            return false;
        }
}
function calculExpression(data){
     return eval(data);
}
function square(data){
   return  Math.pow(parseFloat(calculExpression(data)),2);
}
function checkOperation(cell){
   for(let i in operations){
       if(cell.value==operations[i]){
           return true;
       }
   }
   return false;
}
//when user presses on a particular button
function buttonPress(e){
  let button = e.target;
  let  fullInput = expression.innerHTML;
  if(isNum(button.value)&&checkValidateExpression(result.innerHTML)){
     expression.innerHTML += button.value; 
  }else{
      if(checkOperation(button)&&checkValidateExpression(result.innerHTML)){
          let allowed = true;
          for(let i=0;i<fullInput.length;++i){
            for(let j in operations){
                if(String(fullInput[fullInput.length-1])==operations[j]){
                    allowed = false;
                }
            }
        }
        if(fullInput==""&&result.innerHTML!=""){
            expression.innerHTML = result.innerHTML;
        }   
          if(allowed)
            expression.innerHTML += button.value; 
      }else{
          if(button.value=="AC"){
              clearAll();
          }else if(button.value=="DEL"&&checkValidateExpression(result.innerHTML)){
              Delete(fullInput);
          }else if(button.value=="x^2"&&checkValidateExpression(result.innerHTML)){
              if(fullInput=="")
                result.innerHTML = square(result.innerHTML);
          }else if(button.value=="."&&checkValidateExpression(fullInput)){
                  let alternativeExp = fullInput;
                  alternativeExp += ".";
                  if(checkValidateExpression(alternativeExp))
                  expression.innerHTML += button.value;      
           }else if(button.value=="="&&checkValidateExpression(fullInput)){
            if(checkValidateExpression(result.innerHTML)&&calculExpression(fullInput)!=Infinity){
                if(fullInput!="")
               result.innerHTML = String(calculExpression(fullInput));
               expression.innerHTML = "";
            }else{
                expression.innerHTML = "";
                result.innerHTML = "Syntax Error :(";
            }
           }
          }
      }
  }
function handleClick(){
    input.forEach(cell => {
        cell.addEventListener("click",buttonPress);
    });
}
//main function for calculator to work
handleClick();
