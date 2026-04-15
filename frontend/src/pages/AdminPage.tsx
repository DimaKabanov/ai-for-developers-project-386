import { Container, Title, Text } from '@mantine/core';

export function AdminPage() {
  return (
    <Container size="lg" py={40}>
      <Title order={1} mb="md">
        Админка
      </Title>
      <Text c="dimmed">Здесь будет панель администратора...</Text>
    </Container>
  );
}
