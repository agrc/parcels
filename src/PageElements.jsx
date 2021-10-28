import { Dialog, Listbox, Transition } from '@headlessui/react';
import clsx from 'clsx';
import escapeRegExp from 'lodash.escaperegexp';
import { Fragment, useEffect, useState } from 'react';
import { useOpenClosed } from './hooks';
import logo from './ugrc_logo.png';
import { WebApiProvider } from './vendor/Sherlock/providers';
import useSherlock from './vendor/Sherlock/Sherlock';

const counties = [
  'Beaver',
  'Box Elder',
  'Cache',
  'Carbon',
  'Daggett',
  'Davis',
  'Duchesne',
  'Emery',
  'Garfield',
  'Grand',
  'Iron',
  'Juab',
  'Kane',
  'Millard',
  'Morgan',
  'Piute',
  'Rich',
  'Salt Lake',
  'San Juan',
  'Sanpete',
  'Sevier',
  'Summit',
  'Tooele',
  'Uintah',
  'Utah',
  'Wasatch',
  'Washington',
  'Wayne',
  'Weber',
];
const intl = new Intl.DateTimeFormat('en-US', { dateStyle: 'short' });

export function Header({ county = 'Utah State' }) {
  return (
    <section className="flex items-center justify-between m-1 bg-gradient-to-t from-gray-100 to-white grid-area-header">
      <h1 className="relative inline-block">
        <span className="text-3xl font-bold tracking-tight text-gray-700 sm:font-black sm:text-5xl">
          {county} Parcels
        </span>
        <a
          className="absolute top-0 hidden text-xs font-semibold tracking-tighter text-blue-400 sm:block -right-2"
          href="https://github.com/agrc/parcels/blob/main/CHANGELOG.md"
          target="_blank"
          rel="noreferrer"
        >
          v{import.meta.env.PACKAGE_VERSION}
        </a>
      </h1>
      <img src={logo} className="h-8 sm:h-full" alt="UGRC logo" />
    </section>
  );
}

export function Sidebar({ children, isOpen }) {
  return (
    <section
      className={clsx(
        { hidden: !isOpen },
        'px-3 mb-2 ml-2 overflow-scroll border border-gray-300 shadow bg-gray-50 grid-area-sidebar'
      )}
    >
      <div className="relative">
        {children}
        <p className="mt-10 mb-4 text-sm font-bold tracking-wider text-justify text-gray-700">
          <i>
            <a
              href="http://gis.utah.gov/data/sgid-cadastre/parcels/"
              className="text-blue-400 hover:text-blue-600 active:text-blue-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              Data
            </a>{' '}
            Sourced from County Recorders - hosted and served by{' '}
            <a
              href="http://gis.utah.gov/"
              className="text-blue-400 hover:text-blue-600 active:text-blue-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              UGRC
            </a>
          </i>
        </p>
      </div>
    </section>
  );
}

export function TypeAhead({ label, layer, field, onSuccess }) {
  const provider = new WebApiProvider(import.meta.env.VITE_API_KEY, layer, field);

  const {
    downshift: {
      inputValue,
      isOpen,
      getLabelProps,
      getMenuProps,
      getInputProps,
      getComboboxProps,
      highlightedIndex,
      getItemProps,
    },
    itemToString,
    items,
    limitExceeded,
    maxResults,
    status,
  } = useSherlock({
    provider,
    symbol: {},
    onSelect: onSuccess,
  });

  return (
    <section className="mb-5">
      <label className="text-lg font-semibold" {...getLabelProps()}>
        {label}
      </label>
      <div className="relative" {...getComboboxProps()}>
        {/* eslint-disable-next-line jsx-a11y/autocomplete-valid */}
        <input
          className={clsx(
            { 'rounded-t': items.length > 0 && isOpen, rounded: items.length > 0 && !isOpen },
            'block w-full px-3 py-2 mt-1 text-base text-gray-700 bg-white border border-gray-400 focus:outline-none focus:border-indigo-500'
          )}
          {...getInputProps()}
          autoComplete="never"
        />
        <span className="absolute top-[13px] right-0 flex items-center pr-2 pointer-events-none">
          <span className="w-5 h-5 text-gray-400 esri-icon-search" aria-hidden="true" />
        </span>
      </div>
      <ul
        className={clsx({
          'z-10 rounded-b shadow-lg bg-white border-b border-l border-r border-gray-400': items.length > 0 && isOpen,
        })}
        {...getMenuProps()}
      >
        {isOpen &&
          items?.map((item, index) => (
            <li
              className={clsx(
                {
                  'text-indigo-900 bg-indigo-100': highlightedIndex === index,
                  'text-gray-900': highlightedIndex !== index,
                },
                'relative pl-4 cursor-default select-none'
              )}
              key={`${item}${index}`}
              {...getItemProps({ item, index })}
            >
              <TypeAheadHighlight text={itemToString(item)} highlight={inputValue} />
            </li>
          ))}
        {isOpen && limitExceeded && (
          <li className="relative pl-4 text-sm text-gray-600 select-none">More than {maxResults} items found</li>
        )}
        {status === 'complete' && items.length === 0 && inputValue.length > 2 && (
          <li className="relative pt-2 pl-4 text-sm text-red-600 select-none">No items found</li>
        )}
        {status === 'error' && (
          <li className="relative pt-2 pl-4 text-sm text-red-600 select-none">There was a problem with the service</li>
        )}
      </ul>
    </section>
  );
}

const TypeAheadHighlight = ({ text = '', highlight = '' }) => {
  if (!highlight.trim()) {
    return text;
  }

  const regex = new RegExp(`(${escapeRegExp(highlight)})`, 'gi');
  const parts = text.split(regex);

  return parts
    .filter((part) => part)
    .map((part, i) =>
      regex.test(part) ? (
        <span className="font-bold text-indigo-700" key={i}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
};

export function Section({ children }) {
  return <section className="w-full p-3 mt-3 border border-gray-200 rounded">{children}</section>;
}

export function ParcelTypeAhead({ county = '', onSuccess }) {
  const [selectedCounty, setSelectedCounty] = useState();
  const [layerName, setLayerName] = useState();

  useEffect(() => {
    setSelectedCounty(county);
  }, [county]);

  useEffect(() => {
    if (selectedCounty) {
      setLayerName(`cadastre.${selectedCounty.toLowerCase().replace(' ', '_')}_county_parcels`);
    }
  }, [selectedCounty]);

  return (
    <section className="w-full">
      <div className="text-lg font-semibold">Find a parcel</div>
      <Listbox value={selectedCounty} onChange={setSelectedCounty}>
        <div className="relative mt-1">
          <Listbox.Label>County</Listbox.Label>
          <Listbox.Button className="relative w-full px-3 py-2 mt-1 mb-2 text-base text-left text-gray-700 bg-white border border-gray-400 rounded h-11 focus:outline-none focus:border-indigo-500">
            <span className="block truncate">{selectedCounty}</span>
            <span className="absolute top-[13px] right-0 flex items-center pr-2 pointer-events-none">
              <span className="w-5 h-5 text-gray-400 esri-icon-down" aria-hidden="true" />
            </span>
          </Listbox.Button>
          <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
            <Listbox.Options className="absolute w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none">
              {counties.map((county, i) => (
                <Listbox.Option
                  className={({ active }) =>
                    clsx(
                      { 'text-indigo-900 bg-indigo-100': active, 'text-gray-900': !active },
                      'relative pl-10 pr-4 cursor-default select-none'
                    )
                  }
                  key={i}
                  value={county}
                >
                  {({ selected }) => (
                    <>
                      <span className={clsx({ 'font-bold': selected, 'font-normal': !selected }, 'block truncate')}>
                        {county}
                      </span>
                      {selected ? (
                        <span
                          className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 esri-icon-check-mark"
                          aria-hidden="true"
                        ></span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {selectedCounty && <TypeAhead onSuccess={onSuccess} label="Parcel Number" layer={layerName} field="parcel_id" />}
    </section>
  );
}

export function Disclaimer() {
  let [isOpen, { close }] = useOpenClosed(true);

  return (
    <Transition
      show={isOpen}
      enter="transition-opacity duration-75"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-150"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Dialog as="div" className="fixed inset-0 z-10 overflow-y-auto" onClose={close}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-800/95" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <Dialog.Title as="h3" className="text-3xl font-medium leading-6 text-center text-gray-900">
                Disclaimer
              </Dialog.Title>
              <div className="mt-2 space-y-4">
                <p className="text-sm text-gray-500">
                  No warranties or certification, express or implied, are provided for the statewide tax parcel dataset
                  and related GIS mapping layer. This data product has been compiled as a best effort service strictly
                  for general purpose informational use and any interpretations made are the responsibility of the User.
                </p>
                <p className="text-sm text-gray-500">
                  The State of Utah and County Governments, their elected officials, officers, employees, and agents
                  assume no legal responsibilities for the information contained herein and shall have no liability for
                  any damages, losses, costs, or expenses, including, but not limited to attorney&apos;s fees, arising
                  from the use or misuses of the information provided herein. The User&apos;s use thereof shall
                  constitute an agreement by the User to release The State of Utah and County Government, its elected
                  officials, officers, employees, and agents from such liability.
                </p>
                <p className="text-sm text-gray-500">
                  By using the information contained herein, the User is stating that the above Disclaimer has been read
                  and that he/she has full understanding and is in agreement with the contents of this disclaimer. While
                  the property boundary information depicted in this dataset is based directly on the legal descriptions
                  provided on recorded documents on file in County Recorders’ Offices, it is NOT intended to be used for
                  legal litigation or boundary disputes and is for informational use only. Users interested in pursuing
                  legal litigation and/or boundary disputes should consult an attorney or licensed surveyor, or both.
                </p>
              </div>

              <div className="mt-4 text-right">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                  onClick={close}
                >
                  I agree
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

export function ParcelInformation({ feature }) {
  let [isOpen, { close, open }] = useOpenClosed(false);

  useEffect(() => {
    if (feature !== undefined) {
      open();
    }
  }, [feature, open]);

  return (
    <Transition
      as={Fragment}
      show={isOpen}
      enter="ease-out duration-300"
      enterFrom="opacity-0 scale-95"
      enterTo="opacity-100 scale-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-95"
    >
      <Dialog as="section" className="absolute inset-x-0 bottom-0 z-20 w-full" onClose={close}>
        <div className="flex w-full px-6 py-3 overflow-hidden text-left text-white align-middle transition-all transform bg-gray-900/95">
          <div className="mt-4 text-right">
            <button
              type="button"
              className="absolute px-1 text-white bg-gray-800 border border-white rounded hover:text-red-800 top-2 right-2 hover:bg-gray-50 focus:outline-none"
              onClick={close}
            >
              <span aria-hidden="true" role="presentation" className="w-4 h-4 esri-icon-close"></span>
              <span className="esri-icon-font-fallback-text">Close</span>
            </button>
          </div>
          <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
            {feature?.attributes ? (
              <>
                <div>
                  <h4 className="text-lg font-bold">Parcel Id</h4>
                  <p className="text-gray-300">{feature.attributes.PARCEL_ID}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold">Address</h4>
                  <p className="text-gray-300">{feature.attributes.PARCEL_ADD}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold">City</h4>
                  <p className="text-gray-300">{feature.attributes.PARCEL_CITY}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold">Zip Code</h4>
                  <p className="text-gray-300">{feature.attributes.PARCEL_ZIP}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold">Generalized Ownership Type</h4>
                  <p className="text-gray-300">{feature.attributes.OWN_TYPE}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold">Current as of</h4>
                  <p className="text-gray-300">{intl.format(feature.attributes.ParcelsCur)}</p>
                </div>
                <div>
                  <h4 className="text-lg font-bold">Notes</h4>
                  <p className="text-gray-300">{feature.attributes.ParcelNotes}</p>
                </div>
                {feature.attributes.CoParcel_URL && (
                  <a
                    className="flex flex-row items-center space-x-2 text-lg font-bold text-blue-300 hover:text-blue-100 active:text-blue-500"
                    href={feature.attributes.CoParcel_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span aria-hidden="true" role="presentation" className="w-5 h-5 esri-icon-link-external"></span>
                    <span className="esri-icon-font-fallback-text">Toggle full screen</span>
                    <span>County Parcel Website</span>
                  </a>
                )}
              </>
            ) : (
              <div className="col-span-8 text-xl text-center md:text-3xl">There is no parcel information here.</div>
            )}
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
