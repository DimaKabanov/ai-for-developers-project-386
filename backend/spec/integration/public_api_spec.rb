# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Public API', type: :request do
  describe 'GET /public/owner' do
    it 'returns owner information' do
      get '/public/owner'

      expect(response).to have_http_status(:ok)
      expect(json_response).to include('id' => 'tota-owner', 'name' => 'Tota')
    end
  end

  describe 'GET /public/event-types' do
    it 'returns seeded event types' do
      get '/public/event-types'

      expect(response).to have_http_status(:ok)
      expect(json_response).to be_an(Array)
      expect(json_response.length).to eq(2)

      ids = json_response.map { |et| et['id'] }
      expect(ids).to include('meeting-15min-a7x9k2m3', 'meeting-30min-b4p8n1q7')
    end

    it 'returns event types with required fields' do
      get '/public/event-types'

      json_response.each do |event_type|
        expect(event_type).to include('id', 'name', 'description', 'durationMinutes')
        expect(event_type['durationMinutes']).to be_a(Integer)
        expect(event_type['durationMinutes']).to be > 0
      end
    end
  end

  describe 'GET /public/event-types/:id/slots' do
    context 'with existing event type' do
      it 'returns available slots for 15-minute event type' do
        get '/public/event-types/meeting-15min-a7x9k2m3/slots'

        expect(response).to have_http_status(:ok)
        expect(json_response).to be_an(Array)
        expect(json_response).not_to be_empty

        json_response.each do |slot|
          expect(slot).to include('id', 'startTime', 'endTime', 'isAvailable')
          expect(slot['isAvailable']).to be_in([true, false])
        end
      end

      it 'returns slots with correct duration' do
        get '/public/event-types/meeting-15min-a7x9k2m3/slots'

        slot = json_response.first
        start_time = Time.parse(slot['startTime'])
        end_time = Time.parse(slot['endTime'])
        duration = (end_time - start_time) / 60

        expect(duration).to eq(15)
      end

      it 'returns slots with 15-minute step for 15-minute event type' do
        get '/public/event-types/meeting-15min-a7x9k2m3/slots'

        first_slot = Time.parse(json_response[0]['startTime'])
        second_slot = Time.parse(json_response[1]['startTime'])
        step_minutes = (second_slot - first_slot) / 60

        expect(step_minutes).to eq(15)
      end

      it 'returns slots with 30-minute step for 30-minute event type' do
        get '/public/event-types/meeting-30min-b4p8n1q7/slots'

        first_slot = Time.parse(json_response[0]['startTime'])
        second_slot = Time.parse(json_response[1]['startTime'])
        step_minutes = (second_slot - first_slot) / 60

        expect(step_minutes).to eq(30)
      end
    end

    context 'with non-existent event type' do
      it 'returns 404 with EVENT_TYPE_NOT_FOUND' do
        get '/public/event-types/non-existent-id/slots'

        expect(response).to have_http_status(:not_found)
        expect(json_response).to include(
          'code' => 'EVENT_TYPE_NOT_FOUND',
          'message' => 'Event type was not found'
        )
      end
    end
  end

  describe 'POST /public/event-types/:id/bookings' do
    let(:event_type_id) { 'meeting-15min-a7x9k2m3' }
    let(:valid_start_time) { valid_slot_time(15) }
    let(:valid_params) do
      {
        startTime: valid_start_time.iso8601(3),
        guestName: 'Test User',
        guestEmail: 'test@example.com'
      }
    end

    context 'with valid parameters' do
      it 'creates a booking successfully' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params

        expect(response).to have_http_status(:created)
        expect(json_response).to include(
          'eventTypeId' => event_type_id,
          'guestName' => 'Test User',
          'guestEmail' => 'test@example.com',
          'status' => 'confirmed'
        )
        expect(json_response).to include('id', 'startTime', 'endTime', 'createdAt')
      end

      it 'creates a booking with optional guest note' do
        params = valid_params.merge(guestNote: 'Test note')
        post "/public/event-types/#{event_type_id}/bookings", params: params

        expect(response).to have_http_status(:created)
        expect(json_response['guestNote']).to eq('Test note')
      end

      it 'marks slot as unavailable after booking' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params

        expect(response).to have_http_status(:created)

        get "/public/event-types/#{event_type_id}/slots"
        booked_slot = json_response.find { |slot| slot['startTime'] == valid_params[:startTime] }
        expect(booked_slot['isAvailable']).to be false if booked_slot
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 when startTime is missing' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params.except(:startTime)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/startTime/)
      end

      it 'returns 422 when guestName is missing' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params.except(:guestName)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/guestName/)
      end

      it 'returns 422 when guestEmail is missing' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params.except(:guestEmail)

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/guestEmail/)
      end

      it 'returns 422 when guestEmail is invalid' do
        params = valid_params.merge(guestEmail: 'invalid-email')
        post "/public/event-types/#{event_type_id}/bookings", params: params

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/guestEmail/)
      end
    end

    context 'with non-existent event type' do
      it 'returns 404 with EVENT_TYPE_NOT_FOUND' do
        post '/public/event-types/non-existent-id/bookings', params: valid_params

        expect(response).to have_http_status(:not_found)
        expect(json_response).to include('code' => 'EVENT_TYPE_NOT_FOUND')
      end
    end
  end
end
