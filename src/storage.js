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
const key = (id) => `skills/${id}.md`;

export async function putSkill(id, content) {
  await getClient().send(new PutObjectCommand({
    Bucket: bucket(),
    Key: key(id),
    Body: content,
    ContentType: 'text/markdown',
  }));
}

export async function getSkill(id) {
  try {
    const response = await getClient().send(new GetObjectCommand({
      Bucket: bucket(),
      Key: key(id),
    }));
    return await response.Body.transformToString();
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw err;
  }
}

export async function createPlaceholder(id, metadata) {
  const frontmatter = [
    '---',
    `status: "generating"`,
    `stage: "research"`,
    `contractAddress: "${metadata.contractAddress}"`,
    `chainId: ${metadata.chainId}`,
    '---',
    '',
    '# Skill generation in progress',
    '',
  ].join('\n');
  await putSkill(id, frontmatter);
}

export async function updateStage(id, stage) {
  const content = await getSkill(id);
  if (!content) throw new Error(`Skill ${id} not found`);
  const updated = content.replace(/^stage: ".+"$/m, `stage: "${stage}"`);
  await putSkill(id, updated);
}

export async function markFailed(id, error) {
  const content = await getSkill(id);
  const base = content
    ? content.replace(/^status: ".+"$/m, 'status: "failed"')
    : `---\nstatus: "failed"\n---\n`;
  const withError = base.trimEnd() + `\n\n## Error\n\n${error}\n`;
  await putSkill(id, withError);
}
