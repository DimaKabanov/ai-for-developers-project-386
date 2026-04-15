import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Paper,
  Stack,
  Text,
  TextInput,
  Textarea,
  Button,
  Group,
  Alert,
  Box,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react';
import { useBookingStore } from '../store/bookingStore';
import { apiClient } from '../api/client';
import type { EventTypeSummary } from '../types/api';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

dayjs.locale('ru');

export function BookingConfirmationPage() {
  const { eventTypeId } = useParams<{ eventTypeId: string }>();
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventTypeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get state from store
  const store = useBookingStore();
  const slotId = store.slotId;
  const selectedTime = store.selectedTime;
  const selectedDate = store.selectedDate;
  const setGuestInfo = store.setGuestInfo;
  const reset = store.reset;

  // Form validation
  const form = useForm({
    initialValues: {
      guestName: store.guestName || '',
      guestEmail: store.guestEmail || '',
      guestNote: store.guestNote || '',
    },
    validate: {
      guestName: (value: string) =>
        value.trim().length < 2 ? 'Имя должно содержать минимум 2 символа' : null,
      guestEmail: (value: string) => {
        if (!value) return 'Email обязателен';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Введите корректный email';
        return null;
      },
    },
  });

  // Load event type details
  useEffect(() => {
    const loadEventType = async () => {
      if (!eventTypeId) return;
      try {
        const eventTypes = await apiClient.fetchEventTypes();
        const found = eventTypes.find(et => et.id === eventTypeId);
        if (found) setEventType(found);
      } catch (err) {
        console.error('Failed to load event type', err);
      }
    };
    loadEventType();
  }, [eventTypeId]);

  // Check if we have selection in store
  useEffect(() => {
    if (!slotId || !selectedTime || !eventTypeId) {
      // No selection in store, redirect back
      navigate(`/booking/${eventTypeId || ''}`);
    }
  }, [slotId, selectedTime, eventTypeId, navigate]);

  const handleBack = () => {
    // Save form data to store before going back
    setGuestInfo({
      guestName: form.values.guestName,
      guestEmail: form.values.guestEmail,
      guestNote: form.values.guestNote,
    });
    navigate(-1);
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!eventTypeId || !slotId || !selectedTime) return;

    setLoading(true);
    setError(null);

    try {
      await apiClient.createBooking(eventTypeId, {
        startTime: selectedTime,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        guestNote: values.guestNote || undefined,
      });

      // Success! Reset store and show success state
      reset();
      setIsSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('409')) {
          setError('Это время уже забронировано. Пожалуйста, выберите другое время.');
        } else if (err.message.includes('422')) {
          setError('Ошибка валидации. Проверьте введённые данные.');
        } else {
          setError('Произошла ошибка при бронировании. Попробуйте позже.');
        }
      } else {
        setError('Произошла неизвестная ошибка.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Format date and time for display
  const formatDateTime = () => {
    if (!selectedDate || !eventType) return '';
    const date = dayjs(selectedDate);
    const start = dayjs(selectedTime);
    const end = start.add(eventType.durationMinutes, 'minutes');
    return `${date.format('dddd, D MMMM')}, ${start.format('HH:mm')} – ${end.format('HH:mm')}`;
  };

  // Success state
  if (isSuccess) {
    return (
      <Container size="md" py={60}>
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Stack align="center" gap="lg">
            <Box
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                backgroundColor: 'var(--mantine-color-green-6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconCheck size={40} color="white" />
            </Box>

            <Title order={2} ta="center">
              Бронирование подтверждено
            </Title>

            <Text c="dimmed" ta="center">
              {formatDateTime()}
            </Text>

            {eventType && (
              <Text c="dimmed" ta="center">
                {eventType.name} · {eventType.durationMinutes} мин
              </Text>
            )}

            <Button onClick={() => navigate('/')} mt="md">
              На главную
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  // Form state
  return (
    <Container size="md" py={40}>
      <Title order={1} mb="xl">
        Подтверждение бронирования
      </Title>

      {/* Event details card */}
      {eventType && (
        <Paper shadow="sm" p="lg" radius="md" withBorder mb="xl">
          <Stack gap="xs">
            <Text fw={600} size="lg">
              {eventType.name}
            </Text>
            <Text c="dimmed">{formatDateTime()}</Text>
            <Text c="blue" size="sm">
              {eventType.durationMinutes} мин
            </Text>
          </Stack>
        </Paper>
      )}

      {/* Error alert */}
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Ошибка" color="red" mb="md">
          {error}
        </Alert>
      )}

      {/* Form */}
      <Paper shadow="sm" p="xl" radius="md" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Имя"
              placeholder="Иван Иванов"
              required
              disabled={loading}
              {...form.getInputProps('guestName')}
            />

            <TextInput
              label="Email"
              placeholder="ivan@example.com"
              required
              disabled={loading}
              {...form.getInputProps('guestEmail')}
            />

            <Textarea
              label="Заметки (необязательно)"
              placeholder="Тема встречи, вопросы..."
              minRows={3}
              disabled={loading}
              {...form.getInputProps('guestNote')}
            />

            <Group justify="space-between" mt="md">
              <Button
                variant="default"
                onClick={handleBack}
                disabled={loading}
                leftSection={<IconArrowLeft size={16} />}
              >
                Назад
              </Button>

              <Button type="submit" loading={loading} disabled={loading}>
                Забронировать
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
