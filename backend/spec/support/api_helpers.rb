# frozen_string_literal: true

module ApiHelpers
  def json_response
    JSON.parse(response.body)
  end

  def load_event_types_fixture
    YAML.load_file(Rails.root.join('spec/fixtures/files/event_types.yml'), symbolize_names: true)
  end

  def seed_test_event_types
    fixtures = load_event_types_fixture
    fixtures.each_value do |attrs|
      CalendarStore.instance.create_event_type(attrs.stringify_keys)
    end
  end

  def create_test_event_type(attrs = {})
    defaults = {
      'id' => "test-event-#{SecureRandom.hex(4)}",
      'name' => 'Test Event',
      'description' => 'Test description',
      'durationMinutes' => 30
    }
    CalendarStore.instance.create_event_type(defaults.merge(attrs.stringify_keys))
  end

  def create_test_booking(event_type_id:, start_time:, guest_name: 'Test User', guest_email: 'test@example.com')
    CalendarStore.instance.create_booking(
      event_type_id: event_type_id,
      start_time: start_time,
      guest_name: guest_name,
      guest_email: guest_email,
      guest_note: nil
    )
  end

  def valid_slot_time(duration_minutes = 15)
    now = Time.now.utc
    tomorrow = now + 1.day
    slot_start = Time.utc(tomorrow.year, tomorrow.month, tomorrow.day, 9, 0, 0)
    slot_start += duration_minutes.minutes while slot_start < now
    slot_start
  end

  def iso8601_match?(expected, actual)
    Time.parse(expected).to_i == Time.parse(actual).to_i
  end
end

RSpec.configure do |config|
  config.include ApiHelpers, type: :request
end
