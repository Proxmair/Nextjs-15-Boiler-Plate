import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/UserModel";

export async function GET() {
  await dbConnect();
  const users = await User.find();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  await dbConnect();
  const body = await request.json();
  const user = await User.create(body);
  return NextResponse.json(user);
}
