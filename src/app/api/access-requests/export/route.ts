import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-config';
import { EnhancedAccessRequestService } from '@/lib/services/enhanced-access-request-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | null;
    const accessLevel = searchParams.get('accessLevel') as 'professional' | 'personal' | null;
    const format = searchParams.get('format') || 'csv';

    const enhancedService = new EnhancedAccessRequestService();
    
    // Get filtered access requests
    const accessRequests = await enhancedService.getFilteredRequests(status, accessLevel);

    if (format === 'csv') {
      // Generate CSV content
      const csvHeaders = [
        'ID',
        'Name',
        'Email',
        'Access Level',
        'Status',
        'Submitted At',
        'Processed At',
        'Processed By',
        'Admin Notes',
        'Message'
      ];

      const csvRows = accessRequests.map(request => [
        request.id,
        request.name,
        request.email,
        request.requested_access_level,
        request.status,
        new Date(request.submitted_at).toISOString(),
        request.processed_at ? new Date(request.processed_at).toISOString() : '',
        request.processedBy || '',
        request.admin_notes || '',
        request.message.replace(/"/g, '""') // Escape quotes in message
      ]);

      // Convert to CSV format
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `access-requests-${status || 'all'}-${timestamp}.csv`;

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    if (format === 'json') {
      // Return JSON format
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `access-requests-${status || 'all'}-${timestamp}.json`;

      return new NextResponse(JSON.stringify(accessRequests, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    
  } catch (error) {
    console.error('Error exporting access requests:', error);
    return NextResponse.json(
      { error: 'Failed to export access requests' },
      { status: 500 }
    );
  }
} 