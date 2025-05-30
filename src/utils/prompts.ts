import prompts from 'prompts';

async function promptYesNo(message: string): Promise<boolean> {
  const response = await prompts({
    type: 'confirm',
    name: 'value',
    message,
    initial: true,
  });
  return response.value;
}

export { promptYesNo };
