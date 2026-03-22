import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

let client;

function getClient() {
  if (!client) {
    client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }
  return client;
}

const bucket = () => process.env.S3_BUCKET;
const key = (id) => `skills/${id}.json`;

async function putSkillObject(id, obj) {
  await getClient().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key(id),
    Body: JSON.stringify(obj),
    ContentType: 'application/json',
  }));
}

export async function getSkill(id) {
  try {
    const response = await getClient().send(new GetObjectCommand({
      Bucket: bucket(),
      Key: key(id),
    }));
    const text = await response.Body.transformToString();
    return JSON.parse(text);
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

export async function createPlaceholder(id, metadata) {
  await putSkillObject(id, {
    id,
    status: 'generating',
    stage: 'research',
    contractAddress: metadata.contractAddress,
    chainId: 8453,
    content: '',
  });
}

export async function updateStage(id, stage) {
  const obj = await getSkill(id);
  if (!obj) throw new Error(`Skill ${id} not found`);
  await putSkillObject(id, { ...obj, stage });
}

export async function markFailed(id, error) {
  const obj = await getSkill(id);
  const base = obj ?? { id, chainId: 8453, contractAddress: '', content: '' };
  await putSkillObject(id, { ...base, status: 'failed', content: error });
}

export async function markReady(id, skillContent) {
  const obj = await getSkill(id);
  if (!obj) throw new Error(`Skill ${id} not found`);
  await putSkillObject(id, { ...obj, status: 'ready', content: skillContent });
}
