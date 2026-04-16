# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Booking Conflicts', type: :request do
  let(:event_type_15min) { 'meeting-15min-a7x9k2m3' }
  let(:event_type_30min) { 'meeting-30min-b4p8n1q7' }

  describe 'double booking the same slot' do
    it 'returns 409 when trying to book an already booked slot' do
      start_time = valid_slot_time(15)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'Second User',
        guestEmail: 'second@example.com'
      }

      expect(response).to have_http_status(:conflict)
      expect(json_response).to include(
        'code' => 'SLOT_ALREADY_BOOKED',
        'message' => 'The selected slot is already booked'
      )
      expect(json_response).to include('conflictingStartTime')
    end
  end

  describe 'cross-event-type conflicts' do
    it 'returns 409 when same time is booked for different event types' do
      start_time = valid_slot_time(30)

      post "/public/event-types/#{event_type_30min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'Second User',
        guestEmail: 'second@example.com'
      }

      expect(response).to have_http_status(:conflict)
      expect(json_response['code']).to eq('SLOT_ALREADY_BOOKED')
    end
  end

  describe 'overlapping bookings' do
    it 'returns 409 when booking overlaps with existing booking' do
      start_time = valid_slot_time(30)

      post "/public/event-types/#{event_type_30min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      overlapping_start = start_time + 15.minutes
      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: overlapping_start.iso8601(3),
        guestName: 'Overlapping User',
        guestEmail: 'overlap@example.com'
      }

      expect(response).to have_http_status(:conflict)
      expect(json_response['code']).to eq('SLOT_ALREADY_BOOKED')
    end

    it 'returns 409 when new booking ends during existing booking' do
      start_time = valid_slot_time(15)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: (start_time + 15.minutes).iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      post "/public/event-types/#{event_type_30min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'Overlapping User',
        guestEmail: 'overlap@example.com'
      }

      expect(response).to have_http_status(:conflict)
      expect(json_response['code']).to eq('SLOT_ALREADY_BOOKED')
    end
  end

  describe 'non-overlapping bookings' do
    it 'allows bookings at different times' do
      first_slot = valid_slot_time(15)
      second_slot = first_slot + 15.minutes

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: first_slot.iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: second_slot.iso8601(3),
        guestName: 'Second User',
        guestEmail: 'second@example.com'
      }

      expect(response).to have_http_status(:created)
    end

    it 'allows bookings on different days' do
      tomorrow = Time.now.utc + 1.day
      first_slot = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 9, 0, 0)
      second_slot = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 10, 0, 0)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: first_slot.iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: second_slot.iso8601(3),
        guestName: 'Second User',
        guestEmail: 'second@example.com'
      }

      expect(response).to have_http_status(:created)
    end
  end

  describe 'conflictingStartTime in error response' do
    it 'includes the conflicting booking start time' do
      start_time = valid_slot_time(15)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'First User',
        guestEmail: 'first@example.com'
      }
      expect(response).to have_http_status(:created)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'Second User',
        guestEmail: 'second@example.com'
      }

      conflicting_time = Time.parse(json_response['conflictingStartTime'])
      expect(conflicting_time.to_i).to eq(start_time.to_i)
    end
  end

  describe 'slots reflect booking conflicts' do
    it 'marks booked slot as unavailable in slots list' do
      start_time = valid_slot_time(15)

      post "/public/event-types/#{event_type_15min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'Test User',
        guestEmail: 'test@example.com'
      }
      expect(response).to have_http_status(:created)

      get "/public/event-types/#{event_type_15min}/slots"

      slot_date = start_time.strftime('%Y-%m-%d')
      day_slots = json_response.select do |slot|
        Time.parse(slot['startTime']).strftime('%Y-%m-%d') == slot_date
      end

      booked_slot = day_slots.find { |slot| Time.parse(slot['startTime']).to_i == start_time.to_i }
      expect(booked_slot).not_to be_nil
      expect(booked_slot['isAvailable']).to be false
    end

    it 'marks cross-event-type booked slot as unavailable' do
      start_time = valid_slot_time(30)

      post "/public/event-types/#{event_type_30min}/bookings", params: {
        startTime: start_time.iso8601(3),
        guestName: 'Test User',
        guestEmail: 'test@example.com'
      }
      expect(response).to have_http_status(:created)

      get "/public/event-types/#{event_type_15min}/slots"

      slot_date = start_time.strftime('%Y-%m-%d')
      day_slots = json_response.select do |slot|
        Time.parse(slot['startTime']).strftime('%Y-%m-%d') == slot_date
      end

      booked_slot = day_slots.find { |slot| Time.parse(slot['startTime']).to_i == start_time.to_i }
      expect(booked_slot).not_to be_nil
      expect(booked_slot['isAvailable']).to be false
    end
  end
end
