// Sending message to server
const randInt = (min, max) => Math.floor(min + Math.random() * (max - min + 1));
console.log(randInt(20, 30));
let gcd = (num1, num2) => {
  //Loop till both numbers are not equal
  while (num1 != num2) {
    //check if num1 > num2
    if (num1 > num2) {
      //Subtract num2 from num1
      num1 = num1 - num2;
    } else {
      //Subtract num1 from num2
      num2 = num2 - num1;
    }
  }

  return num2;
};
//console.log(gcd(Math.pow(10, 20), Math.pow(10, 50)));
const gen_key = (q) => {
  console.log(q);
  let key = randInt(100, q);
  console.log(key);
  while (gcd(q, key) !== 1) {
    key = randInt(100, q);
  }
  return key;
};

const power = (a, b, c) => {
  let x = 1;
  let y = a;
  while (b > 0) {
    if (b % 2 !== 0) {
      x = (x * y) % c;
    }
    y = (y * y) % c;
    b = parseInt(b / 2);
  }
  return x % c;
};

const encrypy_msg = (msg, q, h, g) => {
  let en_msg = [];
  let k = gen_key(q);
  let s = power(h, k, q);
  let p = power(g, k, q);
  for (let i = 0; i < msg.length; i++) {
    en_msg.push(msg[i].charCodeAt(0));
  }
  console.log(en_msg);
  for (let j = 0; j < en_msg.length; j++) {
    en_msg[j] = s * en_msg[j];
  }
  console.log(en_msg);
  return { en_msg, p };
};

const decrypt_msg = (en_msg, p, key, q) => {
  console.log(p, key, q);
  let dr_msg = [];
  let h = power(p, key, q);
  console.log(h);
  for (let i = 0; i < en_msg.length; i++) {
    dr_msg.push(String.fromCharCode(parseInt(en_msg[i] / h)));
  }
  console.log(dr_msg);
  return dr_msg;
};

let msg = "hello";
console.log("encryption");
console.log("Original Message :", msg);
let q = randInt(Math.pow(10, 2), Math.pow(10, 3));
let g = randInt(2, q);
let key = gen_key(q);
let h = power(g, key, q);
console.log("g used : ", g);
console.log("g^a used : ", h);
const { en_msg, p } = encrypy_msg(msg, q, h, g);
const dr_msg = decrypt_msg(en_msg, p, key, q);
console.log(dr_msg);

module.exports = {
  randInt,
  gen_key,
  power,
  encrypy_msg,
  decrypt_msg,
};
