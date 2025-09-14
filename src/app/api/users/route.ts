import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/UserModel";

export async function GET() {
  try {
    await dbConnect();
    const users = await User.find();
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch users", error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const user = await User.create(body);
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to create user", error: (error as Error).message },
      { status: 500 }
    );
  }
}
