import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
//import { Buffer } from 'buffer';
//import _sodium from 'libsodium-wrappers';
import HttpRequest from './HttpRequest';

//const Blake2b = require('blakejs').blake2b;
// const blake = require('blakejs');
const { decodeBase64, encodeBase64 } = require('tweetnacl-util');
const base64 = require('base64-js');
const nacl = require('tweetnacl');
const Blake2b = require('blake2b');
const CryptoJS = require('crypto-js');
//const crypto = require('crypto');
//const blake2b = require('blake2b');

function App() {

  var messageId = "";

  const BASE_URL = 'https://buyer-app-preprod.ondc.org';
  const GET_MESSAGE_ID = '/clientApis/v1/search';

  

  useEffect( () => { 


  async function hashMessage(msg) {

    return "";

    // await _sodium.ready;

    // const sodium = _sodium;
    // const digest = sodium.crypto_generichash(64, sodium.from_string(msg));
    // console.log(`digest is: ${digest}`);
    // const digest_base64 = sodium.to_base64(digest, _sodium.base64_variants.ORIGINAL);
    // console.log("digest64: " + digest_base64);
    // return digest_base64;
    // const hash = crypto.createHash('sha512'); // Use SHA-512 for a 64-byte hash
    // hash.update(msg);
    // const stringHash = hash.digest('base64');
    // console.log("string hash: " + stringHash);
    // return stringHash;

    
    // const msgBytes = new TextEncoder().encode(msg);
    // console.log("msgbytes: " + msgBytes);
    // const hashBytes = blake.blake2b(msgBytes)//, null, 64); // 64 is the output length in bytes (Blake2b-512)
    // console.log("hashbytes: " + hashBytes);
    // // Convert the hash bytes to a Base64-encoded string
    // const base64Digest = Buffer.from(hashBytes).toString('base64');
    // console.log("64digest: " + base64Digest);
    // return base64Digest;


    // const encoder = new TextEncoder();
    // const msgUint8 = encoder.encode(msg);
    // const hashUint8 = nacl.hash(msgUint8);
    // return base64.fromByteArray(hashUint8);
  }

  function createSigningString(digestBase64, created, expires) {
    created =  created || Math.floor(Date.now() / 1000);
    expires =  expires || (created + 3600); // 1 hour later
    console.log("created: " + created);
    console.log("expired: " + expires);
    return `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digestBase64}`;
  }

  function signResponse(message, privateKey) {
    const privateKeyBytes = decodeBase64(privateKey);
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, privateKeyBytes);
    return encodeBase64(signature);
  }

  async function createAuthorizationHeader(timestamp, created, expires) {
    // var requestParameters = {
    //   "context": {
    //     "domain": "nic2004:52110",
    //     "country": "IND",
    //     "city": "Kochi",
    //     "action": "search",
    //     "core_version": "1.1.0",
    //     "bap_id": "gamatics.in",
    //     "bap_uri": "https://gamatics.in/api/",
    //     "transaction_id": "e6d9f908-1d26-4ff3-a6d1-3af3d3721054",
    //     "message_id": "a2fe6d52-9fe4-4d1a-9d0b-dccb8b48522d",
    //     "timestamp": timestamp,
    //     "ttl": "P1M"
    //   },
    //   "message": {
    //     "intent": {
    //       "fulfillment": {
    //         "start": {
    //           "location": {
    //             "gps": "10.108768, 76.347517"
    //           }
    //         },
    //         "end": {
    //           "location": {
    //             "gps": "10.102997, 76.353480"
    //           }
    //         }
    //       }
    //     }
    //   }
    // };

    var requestParameters = {
      "context": {
        "domain": "nic2004:52110",
        "country": "IND",
        "city": "*",
        "action": "search",
        "core_version": "1.1.0",
        "bap_id": "gamatics.in",
        "bap_uri": "https://gamatics.in/api/",
        "transaction_id": "123lknh32",
        "message_id": "89s9fosajkjkd",
        "timestamp": "2023-08-19T11:00:13.950Z",
        "ttl": "P1M"
      },
      "message": {
            "intent" : {
                "provider": {
                    "descriptor" : {
                        "name" : "Naveen Stores"
                    }
                },
                "fulfillment": {
                    "end" : {
                        "location" : {
                            "gps" : "12.4535445,77.9283792"
                        }
                    }
                }
            }
        }
    };
    const digestBase64 = await hashMessage(requestParameters);
    console.log(digestBase64);
    const signingKey = createSigningString("/y4QC7IDQaImfnDJ70ldPLN5011JD22wF5TOKeGBoFrloRi64jOQdHRmIq7hCQ6StUCzN5SgYcwCrA8g+zZ1sw==", created, expires);
    console.log(signingKey);
    const signature = signResponse(signingKey, "RHvXG3mUnVEWRItJtjcxZGvlLlHGxOuTud2hoTPKzs8dFs/AZhLZetTH6aeOfiKCMhC3RD6ziau3X3UfJo6gLg==");
    const subscriberId = 'gamatics.in';
    const uniqueKeyId = '721';
    const header = `Signature keyId="${subscriberId}|${uniqueKeyId}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;
    return header;
  }

  async function getHeader() {
    const currentDate = new Date();
    const timestamp = currentDate.toISOString();
    var created = Math.floor(currentDate.getTime() / 1000);
    // Create a Date object from the timestamp
    const date = new Date(created);

    // Add 1 hour to the Date object
    date.setHours(date.getHours() + 1);

    // Convert the updated Date object back to a Unix timestamp (in seconds)
    const expires = date.getTime();

    var header = await createAuthorizationHeader(timestamp, created, expires);
    console.log(header);
    const apiUrl = 'https://pilot-gateway-1.beckn.nsdl.co.in/search';

    const customHeaders = {
      'Authorization': header,
      'Content-Type': 'application/json', // Example content type
      // Add other headers as needed
    };

    // Make a POST request
    axios.post(apiUrl, postData,{headers: customHeaders,},)
      .then(response => {
        console.log('Response data:', response.data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  getHeader();
  





    // const currentDate = new Date();
    // const timestamp = currentDate.toISOString();

    // var requestParameters = {
    //   "context": {
    //     "domain": "nic2004:52110",
    //     "country": "IND",
    //     "city": "*",
    //     "action": "search",
    //     "core_version": "1.1.0",
    //     "bap_id": "gamatics.in",
    //     "bap_uri": "https://gamatics.in/api/",
    //     "transaction_id": "123lknh32",
    //     "message_id": "89s9fosajkjkd",
    //     "timestamp": timestamp,
    //     "ttl": "P1M"
    //   },
    //   "message": {
    //         "intent" : {
    //             "provider": {
    //                 "descriptor" : {
    //                     "name" : "Aata"
    //                 }
    //             },
    //             "fulfillment": {
    //                 "end" : {
    //                     "location" : {
    //                         "gps" : "12.4535445,77.9283792"
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // };

    

    // var publicKey = "HRbPwGYS2XrUx+mnjn4igjIQt0Q+s4mrt191HyaOoC4=";
    // //var privateKey = "RHvXG3mUnVEWRItJtjcxZGvlLlHGxOuTud2hoTPKzs8dFs/AZhLZetTH6aeOfiKCMhC3RD6ziau3X3UfJo6gLg==";

    // var ukid = "721";

    // var bapId = "gamatics.in";

    // var created = Math.floor(currentDate.getTime() / 1000);
  
    // //const timestampMilliseconds = created * 1000;

    // // Create a Date object from the timestamp
    // const date = new Date(created);

    // // Add 1 hour to the Date object
    // date.setHours(date.getHours() + 1);

    // // Convert the updated Date object back to a Unix timestamp (in seconds)
    // const expires = date.getTime();

    // console.log("timestamp is: "  + timestamp);
    // console.log("created: " + created);
    // console.log("expired: " + expires);

    // async function verifyHeader() {
    //   // Step 1: Convert the JSON object to a string
    //   const jsonPayload = JSON.stringify(requestParameters);

    //   // Step 2: Convert the JSON string to a Uint8Array (UTF-8 encoded)
    //   const encoder = new TextEncoder();
    //   const utf8Bytes = encoder.encode(jsonPayload);

    //   // Step 3: Calculate Blake2b512 hash
    //   const hashBytes = Blake2b(utf8Bytes, null, 64); // 64 is the output length in bytes

    //   // Step 4: Convert the hash to a Base64 string
    //   const base64Digest = Buffer.from(hashBytes).toString('base64');

    //   console.log("hash is: " + base64Digest);
    //   var concatenatedString = `(created): ${created}
    //   (expires): ${expires}
    //   digest: BLAKE-512=${base64Digest}
    //   `;

    //   const privateKey = decodeBase64("RHvXG3mUnVEWRItJtjcxZGvlLlHGxOuTud2hoTPKzs8dFs/AZhLZetTH6aeOfiKCMhC3RD6ziau3X3UfJo6gLg==");

    //   // Convert the concatenated string to a Uint8Array
    //   const messageUint8 = new TextEncoder().encode(concatenatedString);

    //   // Sign the message using Ed25519
    //   const signature = tweetnacl.sign.detached(messageUint8, privateKey);

    //   // Encode the signature as base64
    //   const signatureBase64 = encodeBase64(signature);

    //   console.log("signed hash: "  + signatureBase64);

    //   console.log("request parameter: "  + requestParameters);

    //   console.log(`Signature keyId="gamatics.in|721|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signatureBase64}"`);
    // }

    // verifyHeader();

    // async function post() {
    //   const response = await postData(
    //     `${BASE_URL}${GET_MESSAGE_ID}`,
    //     requestParameters,
    //     {
    //       headers: {
    //         Authorization: `Bearer `,
    //       },
    //     },
    //   );
    //   console.log("response is: " + response);
    // }
    // post();
    
  }, []);

  // useEffect(() => {
  //   console.log("message id changed");
  // }, [messageId]);

  const postData = async (url, payload, options) => {
    try {
      console.log('Post url', url);
      return await axios.post(url, payload, options);
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  
  // useEffect(() => {
  //   log("useeffect");
  //   async function search()  {
  //     const instance = new ondc.ONDC({
  //       host: "http://localhost:5000",
  //       bap_id: "gamatics.in",
  //       bap_uri: "https://gamatics.in/api/",
  //       bppId: "bpp.com",
  //       bppUri: "https://bpp.com/beckn",
  //       country: "IND",
  //       city: "std:080",
  //       ttl: "P1M",
  //       publicKey: "HRbPwGYS2XrUx+mnjn4igjIQt0Q+s4mrt191HyaOoC4=",
  //       privateKey: "RHvXG3mUnVEWRItJtjcxZGvlLlHGxOuTud2hoTPKzs8dFs/AZhLZetTH6aeOfiKCMhC3RD6ziau3X3UfJo6gLg==",
  //       uniqueKey: "dev.test.ondc-node.com",
  //       subscriberId: "<Gateway Address>", 
  //     });
  //     // Making a search call to gateway
  //     let body = {
  //       "item": {
  //           "descriptor": {
  //               "name": "Aata"
  //           }
  //       },
  //       "fulfillment": {
  //           "end": {
  //               "location": {
  //                   "gps": "12.4535445,77.9283792"
  //               }
  //           }
  //       }
  //     };
  //     // apiKey is sent in Authorization Header
  //     instance.apiKey = await instance.createAuthorizationHeader(body);
  //     const response = await instance.search(body);
  //     log("response issss : "  + response);
  //   }
  //   search();
  // }),[];
  

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
