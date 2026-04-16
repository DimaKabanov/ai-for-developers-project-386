# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin API', type: :request do
  describe 'GET /admin/event-types' do
    it 'returns all event types' do
      get '/admin/event-types'

      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(2)
    end
  end

  describe 'POST /admin/event-types' do
    let(:valid_params) do
      {
        id: 'new-event-type',
        name: 'New Event Type',
        description: 'Description for new event type',
        durationMinutes: 45
      }
    end

    context 'with valid parameters' do
      it 'creates a new event type' do
        post '/admin/event-types', params: valid_params, as: :json

        expect(response).to have_http_status(:created)
        expect(json_response).to include(
          'id' => 'new-event-type',
          'name' => 'New Event Type',
          'description' => 'Description for new event type',
          'durationMinutes' => 45
        )
      end

      it 'adds the event type to the list' do
        post '/admin/event-types', params: valid_params, as: :json

        get '/admin/event-types'
        ids = json_response.map { |et| et['id'] }
        expect(ids).to include('new-event-type')
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when id is missing' do
        post '/admin/event-types', params: valid_params.except(:id), as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/id/)
      end

      it 'returns 422 when name is missing' do
        post '/admin/event-types', params: valid_params.except(:name), as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/name/)
      end

      it 'returns 422 when description is missing' do
        post '/admin/event-types', params: valid_params.except(:description), as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/description/)
      end

      it 'returns 422 when durationMinutes is missing' do
        post '/admin/event-types', params: valid_params.except(:durationMinutes), as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/durationMinutes/)
      end

      it 'returns 422 when durationMinutes is not a positive integer' do
        post '/admin/event-types', params: valid_params.merge(durationMinutes: 0), as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
      end
    end

    context 'with duplicate id' do
      it 'returns 409 when event type with same id exists' do
        post '/admin/event-types', params: valid_params, as: :json
        expect(response).to have_http_status(:created)

        post '/admin/event-types', params: valid_params, as: :json

        expect(response).to have_http_status(:conflict)
        expect(json_response).to include(
          'code' => 'EVENT_TYPE_ID_CONFLICT',
          'message' => 'Event type with this id already exists'
        )
      end
    end
  end

  describe 'PUT /admin/event-types/:id' do
    let!(:existing_event_type) { create_test_event_type(id: 'update-test', name: 'Original Name') }

    context 'with valid parameters' do
      it 'updates the event type' do
        put '/admin/event-types/update-test', params: {
          name: 'Updated Name',
          description: 'Updated description',
          durationMinutes: 60
        }, as: :json

        expect(response).to have_http_status(:ok)
        expect(json_response['name']).to eq('Updated Name')
        expect(json_response['description']).to eq('Updated description')
        expect(json_response['durationMinutes']).to eq(60)
      end

      it 'preserves unchanged fields' do
        put '/admin/event-types/update-test', params: {
          name: 'Updated Name',
          description: 'Updated description',
          durationMinutes: 60
        }, as: :json

        expect(json_response['id']).to eq('update-test')
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when name is missing' do
        put '/admin/event-types/update-test', params: {
          description: 'Updated description',
          durationMinutes: 60
        }, as: :json

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
      end
    end

    context 'with non-existent event type' do
      it 'returns 404 with EVENT_TYPE_NOT_FOUND' do
        put '/admin/event-types/non-existent-id', params: {
          name: 'New Name',
          description: 'Description',
          durationMinutes: 30
        }, as: :json

        expect(response).to have_http_status(:not_found)
        expect(json_response).to include('code' => 'EVENT_TYPE_NOT_FOUND')
      end
    end
  end

  describe 'DELETE /admin/event-types/:id' do
    let!(:event_type_to_delete) { create_test_event_type(id: 'delete-test') }

    it 'deletes the event type' do
      delete '/admin/event-types/delete-test'

      expect(response).to have_http_status(:no_content)
    end

    it 'removes the event type from the list' do
      delete '/admin/event-types/delete-test'

      get '/admin/event-types'
      ids = json_response.map { |et| et['id'] }
      expect(ids).not_to include('delete-test')
    end

    it 'returns 404 when event type does not exist' do
      delete '/admin/event-types/non-existent-id'

      expect(response).to have_http_status(:not_found)
      expect(json_response).to include('code' => 'EVENT_TYPE_NOT_FOUND')
    end
  end

  describe 'GET /admin/bookings' do
    it 'returns upcoming bookings' do
      event_type_id = 'meeting-15min-a7x9k2m3'
      start_time = valid_slot_time(15)

      create_test_booking(
        event_type_id: event_type_id,
        start_time: start_time,
        guest_name: 'Test User',
        guest_email: 'test@example.com'
      )

      get '/admin/bookings'

      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(1)

      booking = json_response.first
      expect(booking).to include(
        'eventTypeId' => event_type_id,
        'guestName' => 'Test User',
        'guestEmail' => 'test@example.com',
        'status' => 'confirmed'
      )
    end

    it 'returns bookings sorted by start time' do
      event_type_id = 'meeting-15min-a7x9k2m3'

      later_time = valid_slot_time(15)
      earlier_time = later_time - 1.hour

      create_test_booking(
        event_type_id: event_type_id,
        start_time: later_time,
        guest_name: 'Later User'
      )

      create_test_booking(
        event_type_id: event_type_id,
        start_time: earlier_time,
        guest_name: 'Earlier User'
      )

      get '/admin/bookings'

      names = json_response.map { |b| b['guestName'] }
      expect(names).to eq(['Earlier User', 'Later User'])
    end

    it 'excludes past bookings' do
      event_type_id = 'meeting-15min-a7x9k2m3'
      past_time = Time.now.utc - 1.hour

      CalendarStore.instance.instance_variable_set(:@bookings, [{
                                                     id: 'past-booking',
                                                     event_type_id: event_type_id,
                                                     event_type_name: 'Test',
                                                     start_time: past_time,
                                                     end_time: past_time + 15.minutes,
                                                     guest_name: 'Past User',
                                                     guest_email: 'past@example.com',
                                                     guest_note: nil,
                                                     status: 'confirmed',
                                                     created_at: Time.now.utc - 2.hours
                                                   }])

      get '/admin/bookings'

      expect(json_response).to be_empty
    end

    it 'returns empty array when no bookings exist' do
      get '/admin/bookings'

      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response).to be_empty
    end
  end
end
