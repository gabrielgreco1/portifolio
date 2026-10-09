import {handleArcade} from '@/lib/arcade/service.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request){return handleArcade(request);}
export async function POST(request){return handleArcade(request);}
