import { FC, useCallback, useEffect, useState } from 'react';
import { ManagementClient } from '@kontent-ai/management-sdk';

export const ChatSonicApp: FC = () => {
  const [config, setConfig] = useState<Config | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [itemName, setItemName] = useState<string | null>(null);
  const [codeName, setItemCodeName] = useState<string | null>(null);
  const [variantCodeName, setVariantCodeName] = useState<string | null>(null);
  const [watchedElementValue, setWatchedElementValue] = useState<string | null>(null);
  const [elementValue, setElementValue] = useState<string | null>(null);

  const updateWatchedElementValue = useCallback((codename: string) => {
    CustomElement.getElementValue(codename, v => typeof v === 'string' && setWatchedElementValue(v));
  }, []);

  useEffect(() => {
    CustomElement.init((element, context) => {
      if (!isConfig(element.config)) {
        throw new Error('Invalid configuration of the custom element. Please check the documentation.');
      }

      setConfig(element.config);
      setProjectId(context.projectId);
      setIsDisabled(element.disabled);
      setItemName(context.item.name);
      setItemCodeName(context.item.codename);
      setVariantCodeName(context.variant.codename);
      setElementValue(element.value ?? '');
      updateWatchedElementValue(element.config.textElementCodename);
    });
  }, [updateWatchedElementValue]);

  useEffect(() => {
    const newSize = Math.max(document.documentElement.offsetHeight, 50);
    CustomElement.setHeight(Math.ceil(newSize));
  }, []);

  useEffect(() => {
    CustomElement.onDisabledChanged(setIsDisabled);
  }, []);

  useEffect(() => {
    CustomElement.observeItemChanges(i => setItemName(i.name));
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }
    CustomElement.observeElementChanges([config.textElementCodename], () => updateWatchedElementValue(config.textElementCodename));
  }, [config, updateWatchedElementValue]);

  const updateValue = (newValue: string) => {
    CustomElement.setValue(newValue);
    setElementValue(newValue);
  };

  const onKeyDown = (e: any) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          updateValue(e.target.value);
          generateAIContent(e.target.value);
      };
    };

  const saveContent = async (val: any) => {
    const client = new ManagementClient({
      projectId: projectId as any,
      apiKey: config?.managementApiKey as any
    });
    
    await client.upsertLanguageVariant()
      .byItemCodename(codeName as string)
      .byLanguageCodename(variantCodeName as string)
      .withData((builder) => [
        builder.textElement({
          element: {
            codename: 'content'
          },
          value: val.message
        })
      ])
      .toPromise();
  }

  async function generateAIContent(value: string) {
    const options = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'X-API-KEY': config?.apiToken as any
      },
      body: JSON.stringify({
        enable_google_results: 'true',
        enable_memory: false,
        input_text: value
      })
    };

    fetch('https://api.writesonic.com/v2/business/content/chatsonic?engine=premium', options)
      .then(response => response.json())
      .then(response => saveContent(response))
      .catch(err => console.error(err));
  }  

  if (!config || !projectId || elementValue === null || watchedElementValue === null || itemName === null) {
    return null;
  }

  return (
    <>
      <section>
        <textarea value={elementValue} onChange={e => updateValue(e.target.value)} onKeyDown={e => onKeyDown(e)} disabled={isDisabled} tabIndex={0} data-id="root" rows={1} placeholder="" />
        <button onClick={(e: any) => generateAIContent(elementValue)}>
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 20 20" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          </button>
      </section>
    </>
  );
};

ChatSonicApp.displayName = 'ChatSonicApp';

type Config = Readonly<{
  // expected custom element's configuration
  textElementCodename: string;
  managementApiKey: string;
  apiToken: string;
}>;

// check it is the expected configuration
const isConfig = (v: unknown): v is Config =>
  isObject(v) &&
  hasProperty(nameOf<Config>('textElementCodename'), v) &&
  typeof v.textElementCodename === 'string' &&
  hasProperty(nameOf<Config>('managementApiKey'), v) &&
  typeof v.managementApiKey === 'string' &&
  hasProperty(nameOf<Config>('apiToken'), v) &&
  typeof v.apiToken === 'string';

const hasProperty = <PropName extends string, Input extends {}>(propName: PropName, v: Input): v is Input & { [key in PropName]: unknown } =>
  v.hasOwnProperty(propName);

const isObject = (v: unknown): v is {} =>
  typeof v === 'object' &&
  v !== null;

const nameOf = <Obj extends Readonly<Record<string, unknown>>>(prop: keyof Obj) => prop;
