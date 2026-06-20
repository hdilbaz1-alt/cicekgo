"use client";

import React, { useMemo, useState, useEffect } from "react";
import { CustomerGroupMember } from "@/services/customerService";

interface GroupMembersModalProps {
	isOpen: boolean;
	onClose: () => void;
	groupName: string;
	description?: string;
	members: CustomerGroupMember[];
}

export default function GroupMembersModal({ isOpen, onClose, groupName, description, members }: GroupMembersModalProps) {
	const [search, setSearch] = useState("");

	// ESC tuşu ile modal kapatma
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscapeKey);
		}

		return () => {
			document.removeEventListener('keydown', handleEscapeKey);
		};
	}, [isOpen, onClose]);

	const filteredMembers = useMemo(() => {
		if (!search) return members;
		const term = search.toLowerCase();
		return members.filter(m =>
			m.customerName.toLowerCase().includes(term) ||
			m.description.toLowerCase().includes(term)
		);
	}, [members, search]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
			<div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
				{/* Header */}
				<div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between">
					<div>
						<h2 className="text-xl font-bold text-gray-900">{groupName} - Members</h2>
						{description && (
							<p className="text-sm text-gray-600 mt-1">{description}</p>
						)}
					</div>
					<button onClick={onClose} className="text-gray-400 hover:text-gray-600">
						<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				{/* Search */}
				<div className="px-6 py-4 border-b border-gray-100">
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Üye ara..."
							className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
						/>
					</div>
				</div>

				{/* Members list */}
				<div className="max-h-[60vh] overflow-y-auto p-2 sm:p-4">
					<ul className="divide-y divide-gray-100 bg-white rounded-xl">
						{filteredMembers.map((m) => (
							<li key={m.id} className="flex items-center justify-between px-4 py-3">
								<div className="flex items-center space-x-3">
									<div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
										{/* user icon */}
										<svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A7 7 0 0112 15a7 7 0 016.879 2.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
									</div>
									<div>
										<p className="text-sm font-medium text-gray-900">{m.customerName}</p>
										<p className="text-xs text-gray-500">ID: #{m.customerId}</p>
									</div>
								</div>
								<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
								</svg>
							</li>
						))}
					</ul>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
					<p className="text-sm text-gray-600">Toplam {filteredMembers.length} üye</p>
					<button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Kapat</button>
				</div>
			</div>
		</div>
	);
}
