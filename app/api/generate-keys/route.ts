import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const { num_users } = await request.json()

    if (!num_users || num_users < 1) {
      return NextResponse.json(
        { error: 'Invalid number of users' },
        { status: 400 }
      )
    }

    // Generate the specified number of UUIDs
    const keys = Array.from({ length: num_users }, () => uuidv4())

    // Format as CSV
    const csvContent = 'Unique Key\n' + keys.join('\n')

    // Return as CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="user-keys.csv"'
      }
    })
  } catch (error) {
    console.error('Error generating keys:', error)
    return NextResponse.json(
      { error: 'Failed to generate keys' },
      { status: 500 }
    )
  }
}
