import { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Title,
  Text,
  Paper,
  Group,
  Badge,
  Button,
  Stack,
  TextInput,
  Textarea,
  ActionIcon,
  Modal,
  Box,
  Grid,
  NumberInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';
import { apiClient } from '../api/client';
import type { Owner, EventTypeSummary, Booking } from '../types/api';
import styles from './AdminPage.module.css';

// Generate ID from name (transliterate + slugify)
const generateId = (name: string): string => {
  const translit: Record<string, string> = {
    а: 'a',
    б: 'b',
    в: 'v',
    г: 'g',
    д: 'd',
    е: 'e',
    ё: 'yo',
    ж: 'zh',
    з: 'z',
    и: 'i',
    й: 'y',
    к: 'k',
    л: 'l',
    м: 'm',
    н: 'n',
    о: 'o',
    п: 'p',
    р: 'r',
    с: 's',
    т: 't',
    у: 'u',
    ф: 'f',
    х: 'kh',
    ц: 'ts',
    ч: 'ch',
    ш: 'sh',
    щ: 'shch',
    ы: 'y',
    э: 'e',
    ю: 'yu',
    я: 'ya',
    ' ': '-',
    '-': '-',
  };

  const slug = name
    .toLowerCase()
    .split('')
    .map(char => translit[char] || char)
    .join('')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `evt-${slug || 'event'}-${Date.now().toString(36).slice(-4)}`;
};

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const MAX_DURATION = 240;
const MIN_DURATION = 15;

export function AdminPage() {
  // Data states
  const [owner, setOwner] = useState<Owner | null>(null);
  const [eventTypes, setEventTypes] = useState<EventTypeSummary[]>([]);
  const [meetings, setMeetings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [customDuration, setCustomDuration] = useState(false);

  // Form for creating/editing
  const form = useForm({
    initialValues: {
      id: '',
      name: '',
      description: '',
      durationMinutes: 30,
    },
    validate: {
      name: (value: string) =>
        value.trim().length < 2 ? 'Название должно содержать минимум 2 символа' : null,
      description: (value: string) =>
        value.trim().length < 5 ? 'Описание должно содержать минимум 5 символов' : null,
      durationMinutes: (value: number) => {
        if (value < MIN_DURATION) return `Минимальная длительность ${MIN_DURATION} мин`;
        if (value > MAX_DURATION) return `Максимальная длительность ${MAX_DURATION} мин`;
        return null;
      },
    },
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [ownerData, typesData, meetingsData] = await Promise.all([
          apiClient.fetchOwner(),
          apiClient.fetchAdminEventTypes(),
          apiClient.fetchUpcomingBookings(),
        ]);
        setOwner(ownerData);
        setEventTypes(typesData);
        setMeetings(meetingsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось загрузить данные админки');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Auto-generate ID when name changes (only for new events)
  useEffect(() => {
    if (isCreating && form.values.name && !form.values.id) {
      form.setFieldValue('id', generateId(form.values.name));
    }
  }, [form.values.name, isCreating]);

  // Sort meetings by date
  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [meetings]);

  // Handlers
  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    form.reset();
    setCustomDuration(false);
  };

  const handleEdit = (eventType: EventTypeSummary) => {
    setEditingId(eventType.id);
    setIsCreating(false);
    form.setValues({
      id: eventType.id,
      name: eventType.name,
      description: eventType.description,
      durationMinutes: eventType.durationMinutes,
    });
    setCustomDuration(!DURATION_OPTIONS.includes(eventType.durationMinutes));
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    form.reset();
    setCustomDuration(false);
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      setError(null);
      if (editingId) {
        // Update existing
        await apiClient.updateEventType(editingId, {
          name: values.name,
          description: values.description,
          durationMinutes: values.durationMinutes,
        });
        setEventTypes(prev =>
          prev.map(et =>
            et.id === editingId
              ? {
                  ...et,
                  name: values.name,
                  description: values.description,
                  durationMinutes: values.durationMinutes,
                }
              : et
          )
        );
      } else {
        // Create new
        const newEventType = await apiClient.createEventType({
          id: values.id,
          name: values.name,
          description: values.description,
          durationMinutes: values.durationMinutes,
        });
        setEventTypes(prev => [...prev, newEventType]);
      }
      handleCancel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить тип события');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await apiClient.deleteEventType(id);
      setEventTypes(prev => prev.filter(et => et.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить тип события');
    }
  };

  const formatDuration = (minutes: number): string => `${minutes} мин`;

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <Container size="lg" py={40}>
        <Text>Загрузка...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" py={40}>
        <Text c="red">{error}</Text>
      </Container>
    );
  }

  return (
    <Container size="lg" py={40}>
      {/* Owner Card */}
      <Paper shadow="sm" p="xl" radius="md" withBorder className={styles.ownerCard}>
        <Group justify="space-between" align="center">
          <Group>
            <Box className={styles.ownerAvatar}>{getInitials(owner?.name || 'В')}</Box>
            <Stack gap={0}>
              <Text fw={600} size="xl">
                {owner?.name || 'Владелец'}
              </Text>
              <Text c="dimmed" size="sm">
                {owner?.email || 'owner@calendar.app'}
              </Text>
            </Stack>
          </Group>
          <Badge size="lg" variant="light" color="blue">
            {sortedMeetings.length} ПРЕДСТОЯЩИХ
          </Badge>
        </Group>
      </Paper>

      {/* Event Types Section */}
      <Box mb="xl">
        <Group justify="space-between" align="center" className={styles.sectionHeader}>
          <Title order={2}>Типы событий</Title>
          {!isCreating && !editingId && (
            <Button leftSection={<IconPlus size={16} />} onClick={handleCreate}>
              + Новый тип
            </Button>
          )}
          {(isCreating || editingId) && (
            <Button variant="light" onClick={handleCancel}>
              Отмена
            </Button>
          )}
        </Group>

        <Stack gap="md">
          {/* Create/Edit Form */}
          {(isCreating || editingId) && (
            <Paper shadow="sm" p="xl" radius="md" withBorder className={styles.inlineForm}>
              <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack gap="md">
                  <Text fw={600} size="lg">
                    {editingId ? 'Редактировать' : 'Создать тип события'}
                  </Text>

                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        label="ID"
                        placeholder="evt-consultation"
                        disabled={!!editingId}
                        {...form.getInputProps('id')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Название"
                        placeholder="Консультация 30 минут"
                        required
                        {...form.getInputProps('name')}
                      />
                    </Grid.Col>
                  </Grid>

                  <Textarea
                    label="Описание"
                    placeholder="Краткое описание встречи"
                    minRows={2}
                    required
                    {...form.getInputProps('description')}
                  />

                  <Box>
                    <Text size="sm" fw={500} mb="xs">
                      Длительность (мин)
                    </Text>
                    <Group gap="xs" className={styles.durationButtons}>
                      {DURATION_OPTIONS.map(duration => (
                        <Button
                          key={duration}
                          size="sm"
                          variant={form.values.durationMinutes === duration ? 'filled' : 'light'}
                          color="blue"
                          onClick={() => {
                            form.setFieldValue('durationMinutes', duration);
                            setCustomDuration(false);
                          }}
                          className={styles.durationButton}
                        >
                          {duration}
                        </Button>
                      ))}
                      <Group gap={0}>
                        {customDuration && (
                          <NumberInput
                            value={form.values.durationMinutes}
                            onChange={val =>
                              form.setFieldValue('durationMinutes', Number(val) || 15)
                            }
                            min={MIN_DURATION}
                            max={MAX_DURATION}
                            w={80}
                          />
                        )}
                        {!customDuration && (
                          <Button
                            size="sm"
                            variant="light"
                            color="gray"
                            onClick={() => setCustomDuration(true)}
                          >
                            другое
                          </Button>
                        )}
                      </Group>
                    </Group>
                  </Box>

                  <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={handleCancel}>
                      Отмена
                    </Button>
                    <Button type="submit" color="blue">
                      {editingId ? 'Сохранить' : 'Создать'}
                    </Button>
                  </Group>
                </Stack>
              </form>
            </Paper>
          )}

          {/* Event Types List */}
          {eventTypes.map(eventType => (
            <Paper
              key={eventType.id}
              shadow="sm"
              p="lg"
              radius="md"
              withBorder
              className={styles.eventTypeCard}
            >
              <Group justify="space-between" align="flex-start">
                <Stack gap="xs" style={{ flex: 1 }}>
                  <Text fw={600} size="lg">
                    {eventType.name}
                  </Text>
                  <Text c="dimmed" size="sm">
                    {eventType.description}
                  </Text>
                  <Text className={styles.eventId}>id: {eventType.id}</Text>
                </Stack>
                <Group gap="xs">
                  <Badge size="lg" variant="light" color="blue">
                    {formatDuration(eventType.durationMinutes)}
                  </Badge>
                  <ActionIcon variant="light" color="blue" onClick={() => handleEdit(eventType)}>
                    <IconPencil size={18} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => setDeleteConfirmId(eventType.id)}
                  >
                    <IconTrash size={18} />
                  </ActionIcon>
                </Group>
              </Group>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* Upcoming Meetings Section */}
      <Box>
        <Title order={2} mb="md">
          Предстоящие встречи
        </Title>

        {sortedMeetings.length === 0 ? (
          <Paper shadow="sm" p="xl" radius="md" withBorder className={styles.emptyState}>
            <Box className={styles.emptyIcon}>📬</Box>
            <Text fw={600} size="lg" mb="xs">
              Нет предстоящих встреч
            </Text>
            <Text c="dimmed">Бронирования появятся здесь после того, как гости запишутся.</Text>
          </Paper>
        ) : (
          <Stack gap="md">
            {sortedMeetings.map(meeting => (
              <Paper
                key={meeting.id}
                shadow="sm"
                p="lg"
                radius="md"
                withBorder
                className={styles.meetingCard}
              >
                <Group justify="space-between" align="flex-start">
                  <Group>
                    <Box className={styles.meetingAvatar}>{getInitials(meeting.guestName)}</Box>
                    <Stack gap={4}>
                      <Text fw={600}>{meeting.guestName}</Text>
                      <Text size="sm" c="dimmed">
                        {meeting.guestEmail}
                      </Text>
                      {meeting.guestNote && (
                        <Text size="sm" className={styles.meetingNote}>
                          «{meeting.guestNote}»
                        </Text>
                      )}
                    </Stack>
                  </Group>
                  <Stack gap={4} align="flex-end">
                    <Text fw={600}>
                      {new Date(meeting.startTime).toLocaleDateString('ru-RU', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                      ,{' '}
                      {new Date(meeting.startTime).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {new Date(meeting.startTime).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      –{' '}
                      {new Date(meeting.endTime).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Badge color="blue" variant="filled">
                      {meeting.eventTypeName}
                    </Badge>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Подтвердите удаление"
        centered
      >
        <Text mb="lg">
          Вы уверены, что хотите удалить тип события?
          <br />
          Это действие нельзя отменить.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteConfirmId(null)}>
            Отмена
          </Button>
          <Button color="red" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
            Удалить
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
