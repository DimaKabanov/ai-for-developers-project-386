import {
  Container,
  Grid,
  Title,
  Text,
  Button,
  Paper,
  List,
  ThemeIcon,
  Badge,
  Box,
  Flex,
} from '@mantine/core';
import { IconArrowRight, IconCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

export function HomePage() {
  const navigate = useNavigate();

  const features = [
    'Выбор типа события и удобного времени для встречи.',
    'Быстрое бронирование с подтверждением и дополнительными заметками.',
    'Управление типами встреч и просмотр предстоящих записей в админке.',
  ];

  return (
    <Box
      style={{
        minHeight: 'calc(100vh - 60px)',
        background: 'linear-gradient(135deg, #e7f1ff 0%, #fff5e6 100%)',
      }}
    >
      <Container size="lg" py={60}>
        <Grid gutter={60}>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Flex direction="column" gap="md">
              <Badge variant="light" color="blue" size="lg" tt="uppercase" px="md">
                БЫСТРАЯ ЗАПИСЬ НА ЗВОНОК
              </Badge>

              <Title order={1} size="h1" mt="sm">
                Calendar
              </Title>

              <Text size="lg" c="dimmed" maw={500}>
                Забронируйте встречу за минуту: выберите тип события и удобное время.
              </Text>

              <Button
                size="md"
                rightSection={<IconArrowRight size={18} />}
                onClick={() => navigate('/booking')}
                mt="sm"
                w="fit-content"
              >
                Записаться
              </Button>
            </Flex>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper shadow="sm" p="xl" radius="md" withBorder>
              <Title order={3} mb="md">
                Возможности
              </Title>

              <List spacing="sm" size="md">
                {features.map((feature, index) => (
                  <List.Item
                    key={index}
                    icon={
                      <ThemeIcon color="blue" size={20} radius="xl">
                        <IconCheck size={14} />
                      </ThemeIcon>
                    }
                  >
                    {feature}
                  </List.Item>
                ))}
              </List>
            </Paper>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}
