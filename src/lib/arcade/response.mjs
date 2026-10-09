// Edge rate limits may return plain text rather than the API's JSON envelope.
export async function arcadeResponse(response){
 if(response.status===429)return{available:false,error:'rate_limited'};
 try{return await response.json();}catch{return{available:false,error:'temporarily_unavailable'};}
}
