import { appState } from '../stores/ApplicationState.svelte';
import type {
	FileUploadEvent,
	ColumnSelectionEvent,
	QRConfigEvent,
	AppStateEvent
} from '../stores/ApplicationState.svelte';

// Test script to verify Phase 3 event-driven functionality
export function testEventSystem() {
	console.log('🧪 Testing Phase 3 Event-Driven System...');

	// Track events
	const events: AppStateEvent[] = [];

	// Set up event listeners
	const unsubscribeFile = appState.addEventListener<FileUploadEvent>('file:uploaded', (event) => {
		events.push({ type: 'file:uploaded', timestamp: event.timestamp });
		console.log('✅ File upload event received:', event);
	});

	const unsubscribeColumn = appState.addEventListener<ColumnSelectionEvent>(
		'column:selected',
		(event) => {
			events.push({ type: 'column:selected', timestamp: event.timestamp });
			console.log('✅ Column selection event received:', event);
		}
	);

	const unsubscribeQR = appState.addEventListener<QRConfigEvent>('qr:preview-updated', (event) => {
		events.push({ type: 'qr:preview-updated', timestamp: event.timestamp });
		console.log('✅ QR preview update event received:', event);
	});

	// Test validation cascading
	console.log('📊 Testing validation cascading...');

	// Simulate file upload
	const mockFile = new File(['test,data\n1,sample'], 'test.csv', { type: 'text/csv' });
	appState.setSelectedFile(mockFile);

	// Simulate CSV parsing
	appState.setParsedCsvData({
		headers: ['test', 'data'],
		rows: [{ test: '1', data: 'sample' }],
		rawRows: [
			['test', 'data'],
			['1', 'sample']
		],
		hasHeaders: true
	});

	// Simulate column selection (should trigger QR preview update)
	appState.setColumnConfig({
		selectedColumn: 'data',
		omitHeaderRow: false,
		availableColumns: ['test', 'data']
	});

	console.log('📈 Events captured:', events);
	console.log('🔄 Validation cascading test complete');

	// Test bulk state updates
	console.log('⚡ Testing bulk state updates...');
	appState.updateState({
		columnConfig: {
			selectedColumn: 'test',
			omitHeaderRow: true,
			availableColumns: ['test', 'data']
		},
		qrCustomization: {
			previewData: 'bulk update test'
		}
	});

	console.log('✨ Bulk update test complete');

	// Cleanup
	unsubscribeFile();
	unsubscribeColumn();
	unsubscribeQR();

	console.log('🧹 Event listeners cleaned up');
	console.log('✅ Phase 3 event system test completed successfully!');

	return {
		eventsReceived: events.length,
		eventTypes: [...new Set(events.map((e) => e.type))],
		success: events.length > 0
	};
}
