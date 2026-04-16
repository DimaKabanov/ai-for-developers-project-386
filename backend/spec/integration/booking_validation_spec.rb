# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Booking Validation', type: :request do
  let(:event_type_id) { 'meeting-15min-a7x9k2m3' }
  let(:valid_start_time) { valid_slot_time(15) }
  let(:valid_params) do
    {
      startTime: valid_start_time.iso8601(3),
      guestName: 'Test User',
      guestEmail: 'test@example.com'
    }
  end

  describe 'startTime validation' do
    context 'with invalid format' do
      it 'returns 422 when startTime is not ISO 8601' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(startTime: 'invalid-datetime')

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
        expect(json_response['details']).to include(/startTime/)
      end

      it 'returns 422 when startTime is empty' do
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(startTime: '')

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['code']).to eq('VALIDATION_ERROR')
      end
    end

    context 'with past time' do
      it 'returns 422 when startTime is in the past' do
        past_time = Time.now.utc - 1.hour
        post "/public/event-types/#{event_type_id}/bookings",
             params: valid_params.merge(startTime: past_time.iso8601(3))

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['details']).to include(/past/)
      end
    end

    context 'outside booking window' do
      it 'returns 422 when startTime is more than 14 days in the future' do
        future_time = Time.now.utc + 15.days
        post "/public/event-types/#{event_type_id}/bookings",
             params: valid_params.merge(startTime: future_time.iso8601(3))

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['details']).to include(/14 days/)
      end
    end

    context 'outside working hours' do
      it 'returns 422 when startTime is before 09:00 UTC' do
        tomorrow = Time.now.utc + 1.day
        early_time = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 8, 0, 0)

        post "/public/event-types/#{event_type_id}/bookings",
             params: valid_params.merge(startTime: early_time.iso8601(3))

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['details']).to include(/working hours/)
      end

      it 'returns 422 when endTime would be after 18:00 UTC' do
        tomorrow = Time.now.utc + 1.day
        # 17:50 + 15 minutes = 18:05 which is past working hours
        late_time = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 17, 50, 0)

        post "/public/event-types/#{event_type_id}/bookings",
             params: valid_params.merge(startTime: late_time.iso8601(3))

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['details']).to include(/working hours/)
      end
    end

    context 'not aligned to slot grid' do
      it 'returns 422 when startTime is not aligned to slot grid' do
        tomorrow = Time.now.utc + 1.day
        unaligned_time = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 9, 5, 0)

        post "/public/event-types/#{event_type_id}/bookings",
             params: valid_params.merge(startTime: unaligned_time.iso8601(3))

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['details']).to include(/slot grid/)
      end

      it 'returns 422 when startTime has microseconds' do
        tomorrow = Time.now.utc + 1.day
        microsecond_time = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 9, 0, 0, 1000)

        post "/public/event-types/#{event_type_id}/bookings",
             params: valid_params.merge(startTime: microsecond_time.iso8601(3))

        expect(response).to have_http_status(:unprocessable_content)
        expect(json_response['details']).to include(/slot grid/)
      end
    end
  end

  describe 'guestName validation' do
    it 'returns 422 when guestName is empty' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestName: '')

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['details']).to include(/guestName/)
    end

    it 'returns 422 when guestName is whitespace only' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestName: '   ')

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['details']).to include(/guestName/)
    end
  end

  describe 'guestEmail validation' do
    it 'returns 422 when guestEmail is empty' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestEmail: '')

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['details']).to include(/guestEmail/)
    end

    it 'returns 422 when guestEmail is whitespace only' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestEmail: '   ')

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['details']).to include(/guestEmail/)
    end

    it 'returns 422 when guestEmail is invalid format' do
      invalid_emails = [
        'not-an-email',
        '@example.com',
        'user@',
        'user@.com',
        'user space@example.com',
        'user@@example.com'
      ]

      invalid_emails.each do |email|
        post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestEmail: email)

        expect(response).to have_http_status(:unprocessable_content), "Expected 422 for email: #{email}"
        expect(json_response['code']).to eq('VALIDATION_ERROR')
      end
    end

    it 'accepts valid email formats' do
      valid_emails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com'
      ]

      valid_emails.each_with_index do |email, index|
        start_time = valid_slot_time(15) + (index * 15).minutes
        params = valid_params.merge(guestEmail: email, startTime: start_time.iso8601(3))

        post "/public/event-types/#{event_type_id}/bookings", params: params

        expect(response).to have_http_status(:created), "Expected 201 for email: #{email}"
      end
    end
  end

  describe 'guestNote validation' do
    it 'accepts booking without guestNote' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.except(:guestNote)

      expect(response).to have_http_status(:created)
      expect(json_response.keys).not_to include('guestNote')
    end

    it 'accepts empty guestNote' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestNote: '')

      expect(response).to have_http_status(:created)
      expect(json_response.keys).not_to include('guestNote')
    end

    it 'accepts whitespace-only guestNote (treated as empty)' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestNote: '   ')

      expect(response).to have_http_status(:created)
      expect(json_response.keys).not_to include('guestNote')
    end

    it 'stores guestNote when provided' do
      post "/public/event-types/#{event_type_id}/bookings", params: valid_params.merge(guestNote: 'Test note')

      expect(response).to have_http_status(:created)
      expect(json_response['guestNote']).to eq('Test note')
    end
  end

  describe 'multiple validation errors' do
    it 'returns all validation errors in details array' do
      post "/public/event-types/#{event_type_id}/bookings", params: {
        startTime: '',
        guestName: '',
        guestEmail: 'invalid'
      }

      expect(response).to have_http_status(:unprocessable_content)
      expect(json_response['details']).to be_an(Array)
      expect(json_response['details'].length).to be >= 3
    end
  end
end
